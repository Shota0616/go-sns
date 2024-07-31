package routes

import (
	"github.com/gin-gonic/gin"
	"github.com/Shota0616/go-sns/cmd/api/controllers"
	"github.com/gin-contrib/cors"
	"time"
)

func SetupRouter() *gin.Engine {
	router := gin.Default()

	router.Use(cors.New(cors.Config{
        AllowOrigins:     []string{"http://localhost:5173"}, // ReactアプリケーションのURLを指定
        AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
        AllowHeaders:     []string{"Origin", "Content-Type", "Authorization"},
        ExposeHeaders:    []string{"Content-Length"},
        AllowCredentials: true,
        MaxAge:           12 * time.Hour,
    }))

	public := router.Group("/api")
	{
		public.POST("/register", controllers.Register)
		public.POST("/activate", controllers.Activate)
		public.POST("/login", controllers.Login)
		public.POST("/logout", controllers.Logout)
		public.GET("/getuser", controllers.GetUser)
		// テスト用
		public.GET("/ping", controllers.Ping)
	}

	return router
}