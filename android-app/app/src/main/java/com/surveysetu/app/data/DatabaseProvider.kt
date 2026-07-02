package com.surveysetu.app.data

import android.content.Context
import androidx.room.Room

object DatabaseProvider {
    private var database: SurveyDatabase? = null
    lateinit var sessionManager: SessionManager
        private set

    fun init(context: Context) {
        if (database == null) {
            database = Room.databaseBuilder(
                context.applicationContext,
                SurveyDatabase::class.java,
                "survey_setu.db"
            )
            .fallbackToDestructiveMigration() // For simplicity during development
            .build()
            
            sessionManager = SessionManager(context.applicationContext)
            
            // Restore token to RetrofitClient on startup
            RetrofitClient.authToken = sessionManager.getToken()
        }
    }

    fun getDatabase(): SurveyDatabase {
        return database ?: throw IllegalStateException("DatabaseProvider not initialized")
    }
}
