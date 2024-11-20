package controllers

import (
	"context"
	"fmt"
	"math/rand"
	"net/http"
	"time"
	"strings"
	"os"


	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/Shota0616/go-sns/auth"
	"github.com/Shota0616/go-sns/config"
	"github.com/Shota0616/go-sns/models"
	"golang.org/x/crypto/bcrypt"
)

// ユーザー登録を処理する関数
func Register(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "入力データが不正です"})
        return
    }

    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "パスワードの暗号化に失敗しました"})
        return
    }

	user := models.User{
		Username: input.Username,
		Password: string(hashedPassword),
		Email:    input.Email,
		IsActive: false,
	}

    if err := config.DB.Create(&user).Error; err != nil {
        if strings.Contains(err.Error(), "for key 'users.uni_users_email'") {
            c.JSON(http.StatusConflict, gin.H{"error": "このメールアドレスは既に登録されています"})
        } else if strings.Contains(err.Error(), "for key 'users.uni_users_username'") {
			c.JSON(http.StatusConflict, gin.H{"error": "このユーザー名は既に登録されています"})
		} else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "ユーザー登録に失敗しました"})
        }
        return
    }

	// if err := config.DB.Create(&user).Error; err != nil {
	// 	c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
	// 	return
	// }


	// 4桁の認証コードを生成
	rand.Seed(time.Now().UnixNano())
	verificationCode := fmt.Sprintf("%04d", rand.Intn(10000))

	// Redisに認証コードを保存
	if err := config.RDB.Set(context.Background(), user.Email, verificationCode, 10*time.Minute).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save verification code to Redis"})
		return
	}

    // 認証コードをメールで送信
    // subject := "Your Verification Code"
    // body := fmt.Sprintf("Your verification code is: %s", verificationCode)
    // if err := auth.SendEmail(user.Email, subject, body); err != nil {
    //     c.JSON(http.StatusInternalServerError, gin.H{"error": "メールの送信に失敗しました"})
    //     return
    // }

    c.JSON(http.StatusOK, gin.H{"message": "ユーザー登録に成功しました。メールで認証コードを確認してください。"})
}

// ユーザーのログインを処理する関数
func Login(c *gin.Context) {
	// url := os.Getenv("APP_URL") // アプリケーションのURLを環境変数から取得

	var input struct {
		Email    string `json:"email"`    // メールアドレス
		Password string `json:"password"` // パスワード
	}

	// リクエストのJSONボディを構造体にバインド
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// メールアドレスでユーザーをデータベースから取得
	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "ユーザーが見つかりません"})
		return
	}

	// パスワードの照合
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "パスワードが間違っています"})
		return
	}

	// ユーザがアクティブかどうかを確認
	if (!user.IsActive) {
		// // 4桁の認証コードを生成
		rand.Seed(time.Now().UnixNano())
		verificationCode := fmt.Sprintf("%04d", rand.Intn(10000))

		// Redisに保存されている認証コードを削除
		if err := config.RDB.Del(context.Background(), input.Email).Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete verification code from Redis"})
			return
		}

		// Redisに認証コードを保存
		if err := config.RDB.Set(context.Background(), user.Email, verificationCode, 10*time.Minute).Err(); err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save verification code to Redis"})
			return
		}

		// 認証コードをメールで送信
		// subject := "Your Verification Code"
		// body := fmt.Sprintf("Your verification code is: %s", verificationCode)
		// if err := auth.SendEmail(user.Email, subject, body); err != nil {
		// 	c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send email"})
		// 	return
		// }

        // 認証コードの入力画面にリダイレクトする。
        c.JSON(http.StatusSeeOther, gin.H{"error": "アカウントが有効化されていません。認証メールを再送しました。"})
        return
		// ここで処理を終了して、認証コードの入力画面にリダイレクトする
	}

	// JWTトークンとリフレッシュトークンを生成
	token, err := auth.GenerateJWT(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	refreshtoken, err := auth.GenerateRefreshToken(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate refresh token"})
		return
	}

	// トークンとリフレシュトークンをクライアントに返す
	c.JSON(http.StatusOK, gin.H{"token": token, "refreshtoken": refreshtoken})
}


// トークンのリフレッシュを処理する関数
func RefreshToken(c *gin.Context) {
	var input struct {
		RefreshToken string `json:"refresh_token"` // リフレッシュトークン
	}

	// リクエストのJSONボディを構造体にバインド
	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// リフレッシュトークンの検証
	claims, err := auth.ValidateJWT(input.RefreshToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid refresh token"})
		return
	}

	// 新しいアクセストークンを生成
	newToken, err := auth.GenerateJWT(claims.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate new token"})
		return
	}

	// 新しいアクセストークンをクライアントに返す
	c.JSON(http.StatusOK, gin.H{"token": newToken})
}


// ユーザーの認証コードを検証する関数
func Verify(c *gin.Context) {
	var input struct {
		Email            string `json:"email"`
		VerificationCode string `json:"verificationCode"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Redisから認証コードを取得
	val, err := config.RDB.Get(context.Background(), input.Email).Result()
	if err == redis.Nil || val != input.VerificationCode {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired verification code"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not verify code"})
		return
	}

	// ユーザをアクティブにする
	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	user.IsActive = true
	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to activate user"})
		return
	}

	// Redisから認証コードを削除
	if err := config.RDB.Del(context.Background(), input.Email).Err(); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete verification code from Redis"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "メールアドレスが認証されました"})
}


// パスワード再設定リクエストを処理する関数
func RequestPasswordReset(c *gin.Context) {
    var input struct {
        Email string `json:"email"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "入力データが不正です"})
        return
    }

    var user models.User
    if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "ユーザーが見つかりません"})
        return
    }

    // トークンを生成,useridをキーにしてRedisに保存
	token, err := auth.GenerateJWT(user.ID)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "トークンの生成に失敗しました"})
        return
    }

    // Redisにトークンを保存
    if err := config.RDB.Set(context.Background(), user.Email, token, 10*time.Minute).Err(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "トークンの保存に失敗しました"})
        return
    }

    // トークンをメールで送信
    resetURL := fmt.Sprintf("%s/auth/reset-password?token=%s", os.Getenv("APP_URL"), token)
    subject := "パスワード再設定リンク"
    body := fmt.Sprintf("パスワード再設定のリンクは以下です: %s", resetURL)
    if err := auth.SendEmail(user.Email, subject, body); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "メールの送信に失敗しました"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "パスワード再設定リンクをメールで送信しました"})
}


// パスワード再設定を処理する関数
func ResetPassword(c *gin.Context) {
    var input struct {
        Token       string `json:"token"`
        NewPassword string `json:"newPassword"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "入力データが不正です"})
        return
    }

    // トークンを検証し、クレームを取得
    claims, err := auth.ValidateJWT(input.Token)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "トークンが無効または期限切れです"})
        return
    }

	// クレームからユーザーIDを取得
	userID := claims.ID

    // トークンのクレームから取得したユーザーIDでユーザーを取得
	var user models.User
	if err := config.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "ユーザーが見つかりません"})
		return
	}

    // 新しいパスワードをハッシュ化
    hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.NewPassword), bcrypt.DefaultCost)
    if err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "パスワードの暗号化に失敗しました"})
        return
    }

    // パスワードを更新
    user.Password = string(hashedPassword)
    if err := config.DB.Save(&user).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "パスワードの更新に失敗しました"})
        return
    }

    // Redisからトークンを削除
    if err := config.RDB.Del(context.Background(), input.Token).Err(); err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "トークンの削除に失敗しました"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "パスワードが再設定されました"})
}