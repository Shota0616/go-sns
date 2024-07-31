package controllers

import (
	"net/http"
	"time"
	"context"
	"github.com/gin-gonic/gin"
	"github.com/go-redis/redis/v8"
	"github.com/Shota0616/go-sns/config"
	"github.com/Shota0616/go-sns/models"
	"github.com/Shota0616/go-sns/auth"
	"golang.org/x/crypto/bcrypt"
)


func Register(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
		Email    string `json:"email"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Password encryption failed"})
		return
	}

	user := models.User{
		Username: input.Username,
		Password: string(hashedPassword),
		Email:    input.Email,
		IsActive: false,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	// 仮登録用のトークンを生成
	token, err := auth.GenerateJWT(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	// トークンをRedisに保存
	config.RDB.Set(context.Background(), user.Email, token, 24*time.Hour)

	// 仮登録メール送信
	subject := "仮登録のご案内"
	body := "以下のリンクをクリックして本登録を完了してください。\n" +
		"http://yourdomain.com/activate?token=" + token + "&email=" + user.Email
	if err := auth.SendEmail(user.Email, subject, body); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to send email"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "User registered. Please check your email to activate your account."})
}

func Activate(c *gin.Context) {
	var input struct {
		Email string `json:"email"`
		Token string `json:"token"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Redisからトークンを取得
	val, err := config.RDB.Get(context.Background(), input.Email).Result()
	if err == redis.Nil || val != input.Token {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not verify token"})
		return
	}

	var user models.User
	if err := config.DB.Where("email = ?", input.Email).First(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "User not found"})
		return
	}

	user.IsActive = true
	config.DB.Save(&user)

	// Redisからトークンを削除
	config.RDB.Del(context.Background(), input.Email)

	c.JSON(http.StatusOK, gin.H{"message": "User activated. You can now log in."})
}

func Login(c *gin.Context) {
	var input struct {
		Username string `json:"username"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var user models.User
	if err := config.DB.Where("username = ?", input.Username).First(&user).Error; err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(input.Password)); err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid password"})
		return
	}

	if !user.IsActive {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Account is not activated"})
		return
	}

	token, err := auth.GenerateJWT(user.Username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Could not generate token"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"token": token})
}

func Logout(c *gin.Context) {
	token := c.GetHeader("Authorization")
	if token == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token required"})
		return
	}

	claims, err := auth.ValidateJWT(token)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	config.RDB.Del(context.Background(), claims.Username)

	c.JSON(http.StatusOK, gin.H{"message": "User logged out"})
}