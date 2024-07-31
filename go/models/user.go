package models

import "gorm.io/gorm"

type User struct {
	gorm.Model
	Username string `gorm:"type:varchar(255);uniqueIndex"`
	Email    string `gorm:"type:varchar(255);unique"`
	Password string `gorm:"type:varchar(255)"`
	IsActive bool
}