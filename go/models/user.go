package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	ID       uint   `gorm:"primaryKey"`
	Username string `gorm:"type:varchar(255);unique"`
	Email    string `gorm:"type:varchar(255);unique"`
	Password string `gorm:"type:varchar(255)"`
	// 自己紹介文
	Bio string `gorm:"type:varchar(255)"`
	// プロフィール画像のURL
	ProfileImageURL string `gorm:"type:varchar(255)"`
	IsActive bool
}
