package models

import "gorm.io/gorm"

type Follow struct {
    gorm.Model
    FollowerID uint `gorm:"not null"`
    FollowedID uint `gorm:"not null"`
}