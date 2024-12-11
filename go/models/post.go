package models

import "gorm.io/gorm"
type Post struct {
	gorm.Model
	ID      uint   `gorm:"primaryKey"`
    UserID  *uint  `gorm:"type:bigint;index"` // Userモデルの外部キー、NULLを許可
	User    User   `gorm:"constraint:OnUpdate:CASCADE,OnDelete:SET NULL;"` // 外部キー制約
	Content string `gorm:"type:varchar(255);unique"`
	LikeCount int	`gorm:"type:int"`
}
