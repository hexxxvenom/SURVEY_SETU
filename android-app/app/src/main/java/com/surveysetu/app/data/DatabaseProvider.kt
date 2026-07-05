package com.surveysetu.app.data

import android.content.Context
import androidx.room.Room
import androidx.room.migration.Migration
import androidx.sqlite.db.SupportSQLiteDatabase

object DatabaseProvider {
    private var database: SurveyDatabase? = null
    lateinit var sessionManager: SessionManager

    // MIGRATION 1 to 2: Add language column to surveys table
    private val MIGRATION_1_2 = object : Migration(1, 2) {
        override fun migrate(db: SupportSQLiteDatabase) {
            db.execSQL("ALTER TABLE surveys ADD COLUMN language TEXT NOT NULL DEFAULT 'en'")
        }
    }

    fun init(context: Context) {
        sessionManager = SessionManager(context)
        database = Room.databaseBuilder(
            context.applicationContext,
            SurveyDatabase::class.java,
            "survey_setu.db"
        )
        .addMigrations(MIGRATION_1_2) // Handle auto-update of existing databases
        .build()
    }

    fun getDatabase(): SurveyDatabase {
        return database ?: throw IllegalStateException("Database not initialized")
    }
}
