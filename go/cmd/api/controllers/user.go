package controllers

import (
	"net/http"
	"github.com/gin-gonic/gin"
	"github.com/Shota0616/go-sns/config"
	"github.com/Shota0616/go-sns/models"
	"github.com/Shota0616/go-sns/auth"
	"golang.org/x/crypto/bcrypt"
	"github.com/nicksnyder/go-i18n/v2/i18n"
)

func GetUser(c *gin.Context) {
    id := c.Param("id")
    var user models.User
    if err := config.DB.Where("id = ?", id).First(&user).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
        return
    }

    tokenStr := c.GetHeader("Authorization")
    if tokenStr != "" {
        claims, err := auth.ValidateJWT(tokenStr)
        if err == nil && claims.ID == user.ID {
            // ログインしているユーザー自身の場合、すべての情報を返す
            c.JSON(http.StatusOK, gin.H{
                "id":       user.ID,
                "username": user.Username,
                "email":    user.Email,
                "bio":      user.Bio,
                "profile_image_url": user.ProfileImageURL,
            })
            return
        }
    }

    // 他のユーザーの場合、制限された情報を返す
    c.JSON(http.StatusOK, gin.H{
        "id":       user.ID,
        "username": user.Username,
        "bio":      user.Bio,
        "profile_image_url": user.ProfileImageURL,
    })
}

func GetAuthUser(c *gin.Context) {
	tokenStr := c.GetHeader("Authorization")
	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization token not provided"})
		return
	}

	claims, err := auth.ValidateJWT(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token"})
		return
	}

	var user models.User
	if err := config.DB.Where("id = ?", claims.ID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id":       user.ID,
		"username": user.Username,
		"email":    user.Email,
		"bio":      user.Bio,
		"profile_image_url": user.ProfileImageURL,
	})
}

func UpdateUser(c *gin.Context) {
	var input struct {
		Email    string `json:"email"`
		Password string `json:"password"`
	}

	if err := c.ShouldBindJSON(&input); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	tokenStr := c.GetHeader("Authorization")
	if tokenStr == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "authorization_token_not_provided"})})
		return
	}

	claims, err := auth.ValidateJWT(tokenStr)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "invalid_token"})})
		return
	}

	userID := claims.ID

	var user models.User
	if err := config.DB.Where("id = ?", userID).First(&user).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "user_not_found"})})
		return
	}

	if input.Email != "" {
		user.Email = input.Email
	}

	if input.Password != "" {
		hashedPassword, err := bcrypt.GenerateFromPassword([]byte(input.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "password_encryption_failed"})})
			return
		}
		user.Password = string(hashedPassword)
	}

	if err := config.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "user_update_failed"})})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "user_updated_successfully"})})
}

func DeleteUser(c *gin.Context) {
    tokenStr := c.GetHeader("Authorization")
    if tokenStr == "" {
        c.JSON(http.StatusUnauthorized, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "authorization_token_not_provided"})})
        return
    }

    claims, err := auth.ValidateJWT(tokenStr)
    if err != nil {
        c.JSON(http.StatusUnauthorized, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "invalid_token"})})
        return
    }

    userID := claims.ID

    var user models.User
    if err := config.DB.Where("id = ?", userID).First(&user).Error; err != nil {
        c.JSON(http.StatusNotFound, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "user_not_found"})})
        return
    }

    if err := config.DB.Delete(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "user_deletion_failed"})})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": config.Localizer.MustLocalize(&i18n.LocalizeConfig{MessageID: "user_deleted_successfully"})})
}
