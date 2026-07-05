package com.surveysetu.app.data

import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.Database
import androidx.room.RoomDatabase
import androidx.room.TypeConverters

@Entity(tableName = "surveys")
data class SurveyEntity(
    @PrimaryKey val id: String,
    val title: String,
    val version: Int,
    val isPublished: Boolean,
    val language: String // Added for auto-language detection in printing
)

@Entity(tableName = "questions")
data class QuestionEntity(
    @PrimaryKey val id: String,
    val surveyId: String,
    val questionText: String,
    val orderIndex: Int,
    val isMandatory: Boolean,
    val optionCount: Int
)

@Entity(tableName = "responses")
data class ResponseEntity(
    @PrimaryKey val id: String,
    val surveyId: String,
    val surveyVersion: Int,
    val deviceId: String,
    val surveyorId: String,
    val gpsLat: Double?,
    val gpsLng: Double?,
    val respondentPhotoPath: String?,
    val answersJson: String, 
    val isSynced: Boolean = false
)

@Entity(tableName = "options")
data class OptionEntity(
    @PrimaryKey val id: String,
    val questionId: String,
    val optionText: String,
    val orderIndex: Int
)

@Entity(tableName = "answers")
data class AnswerEntity(
    @PrimaryKey(autoGenerate = true) val id: Long = 0,
    val responseId: String,
    val questionId: String,
    val selectedOptionId: String
)

@Database(entities = [SurveyEntity::class, QuestionEntity::class, OptionEntity::class, ResponseEntity::class, AnswerEntity::class], version = 2, exportSchema = false)
abstract class SurveyDatabase : RoomDatabase() {
    abstract fun surveyDao(): SurveyDao
}
