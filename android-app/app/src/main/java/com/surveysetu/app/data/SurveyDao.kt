package com.surveysetu.app.data

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface SurveyDao {
    @Query("SELECT * FROM surveys WHERE isPublished = 1 LIMIT 1")
    suspend fun getActiveSurvey(): SurveyEntity?

    @Query("SELECT * FROM surveys WHERE isPublished = 1")
    suspend fun getAllActiveSurveys(): List<SurveyEntity>

    @Query("SELECT * FROM questions WHERE surveyId = :surveyId ORDER BY orderIndex ASC")
    suspend fun getQuestionsForSurvey(surveyId: String): List<QuestionEntity>

    @Query("SELECT * FROM options WHERE questionId = :questionId ORDER BY orderIndex ASC")
    suspend fun getOptionsForQuestion(questionId: String): List<OptionEntity>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertSurvey(survey: SurveyEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertQuestions(questions: List<QuestionEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOptions(options: List<OptionEntity>)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertResponse(response: ResponseEntity)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertAnswers(answers: List<AnswerEntity>)

    @Query("SELECT * FROM responses WHERE isSynced = 0")
    suspend fun getUnsyncedResponses(): List<ResponseEntity>

    @Transaction
    @Query("SELECT * FROM answers WHERE responseId = :responseId")
    suspend fun getAnswersForResponse(responseId: String): List<AnswerEntity>

    @Query("UPDATE responses SET isSynced = 1 WHERE id = :responseId")
    suspend fun markResponseSynced(responseId: String)
    
    @Query("DELETE FROM surveys")
    suspend fun clearAllSurveys()

    @Query("DELETE FROM questions")
    suspend fun clearAllQuestions()

    @Query("DELETE FROM options")
    suspend fun clearAllOptions()
}
