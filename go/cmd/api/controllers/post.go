package controllers

import (
    "net/http"
    "time"
	"strconv"

    "github.com/gin-gonic/gin"
    "github.com/Shota0616/go-sns/auth"
    "github.com/Shota0616/go-sns/config"
    "github.com/Shota0616/go-sns/models"
    "gorm.io/gorm"
)

func CreatePost(c *gin.Context) {
    // input構造体を定義
    var input struct {
        Content string `json:"content"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    // 投稿者の情報を取得
    tokenStr := c.GetHeader("Authorization")

    var userID *uint
    if tokenStr != "" {
        claims, err := auth.ValidateJWT(tokenStr)
        if err == nil {
            userID = &claims.ID
        }
    }

    // userIDがnilの場合、データベースにはNULLとして保存される
    post := models.Post{
        Content: input.Content,
        UserID:  userID,
        LikeCount: 0,
    }

    // 投稿データをMySQLに保存
    if err := config.DB.Create(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create post"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Post created successfully", "post": post})
}

func GetPost(c *gin.Context) {
    postID := c.Param("id")

    var post models.Post
    if err := config.DB.Where("id = ?", postID).First(&post).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get post"})
        }
        return
    }

    c.JSON(http.StatusOK, post)
}

// GetPostsByUser は特定のユーザーの投稿一覧を取得する関数
func GetPostsByUser(c *gin.Context) {
    userID := c.Param("id")
    var posts []models.Post

    // クエリパラメータからページ番号を取得
    page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
    limit := 10
    offset := (page - 1) * limit

    if err := config.DB.Preload("User").Where("user_id = ?", userID).Order("created_at desc").Limit(limit).Offset(offset).Find(&posts).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get posts"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"posts": posts})
}

func UpdatePost(c *gin.Context) {
    postID := c.Param("id")

    var updatedPost models.Post
    if err := c.ShouldBindJSON(&updatedPost); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    var post models.Post
    if err := config.DB.Where("id = ?", postID).First(&post).Error; err != nil {
        if err == gorm.ErrRecordNotFound {
            c.JSON(http.StatusNotFound, gin.H{"error": "Post not found"})
        } else {
            c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to get post"})
        }
        return
    }

    post.Content = updatedPost.Content
    post.UpdatedAt = time.Now()

    if err := config.DB.Save(&post).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update post"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Post updated successfully", "post": post})
}

func DeletePost(c *gin.Context) {
    postID := c.Param("id")

    if err := config.DB.Delete(&models.Post{}, postID).Error; err != nil {
        c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete post"})
        return
    }

    c.JSON(http.StatusOK, gin.H{"message": "Post deleted successfully"})
}