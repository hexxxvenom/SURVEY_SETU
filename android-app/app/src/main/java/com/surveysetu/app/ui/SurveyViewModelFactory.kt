package com.surveysetu.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import com.surveysetu.app.data.DatabaseProvider
import com.surveysetu.app.data.RetrofitClient
import com.surveysetu.app.data.SurveyRepository

class SurveyViewModelFactory : ViewModelProvider.Factory {
    override fun <T : ViewModel> create(modelClass: Class<T>): T {
        if (modelClass.isAssignableFrom(SurveyViewModel::class.java)) {
            val database = DatabaseProvider.getDatabase()
            val dao = database.surveyDao()
            val api = RetrofitClient.apiService
            val repository = SurveyRepository(api, dao)
            @Suppress("UNCHECKED_CAST")
            return SurveyViewModel(repository, dao) as T
        }
        throw IllegalArgumentException("Unknown ViewModel class")
    }
}
