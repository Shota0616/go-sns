package controllers

import (
    "net/http"
    "github.com/gin-gonic/gin"
    "github.com/Shota0616/go-sns/config"
    "github.com/Shota0616/go-sns/models"
)

func FollowUser(c *gin.Context) {
    var input struct {
        FollowedID uint `json:"followed_id"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    followerID, exists := c.Get("id")
    if (!exists) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
        return
    }

    follow := models.Follow{
        FollowerID: followerID.(uint),
        FollowedID: input.FollowedID,
    }

    if err := config.DB.Create(&follow).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to follow user"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "User followed successfully"})
}

func UnfollowUser(c *gin.Context) {
    var input struct {
        FollowedID uint `json:"followed_id"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    followerID, exists := c.Get("id")
    if (!exists) {
        c.JSON(http.StatusUnauthorized, gin.H{"error": "Unauthorized"})
        return
    }

    if err := config.DB.Where("follower_id = ? AND followed_id = ?", followerID, input.FollowedID).Delete(&models.Follow{}).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to unfollow user"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "User unfollowed successfully"})
}

func GetFollowers(c *gin.Context) {
    userID := c.Param("id")

    var followers []models.Follow
    if err := config.DB.Where("followed_id = ?", userID).Find(&followers).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get followers"})
        return
    }

    c.JSON(http.StatusOK, followers)
}

func GetFollowing(c *gin.Context) {
    userID := c.Param("id")

    var following []models.Follow
    if err := config.DB.Where("follower_id = ?", userID).Find(&following).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get following"})
        return
    }

    c.JSON(http.StatusOK, following)
}