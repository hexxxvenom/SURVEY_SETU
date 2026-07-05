package com.surveysetu.app.ui

import android.util.Log
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.surveysetu.app.data.SurveyEntity

// SHARED UI MODELS
data class QuestionUiModel(val id: String, val text: String, val isMandatory: Boolean, val options: List<OptionUiModel>)
data class OptionUiModel(val id: String, val text: String)
data class AnswerUiModel(val questionId: String, val selectedOptionId: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SurveyScreen(
    surveyId: String,
    viewModel: SurveyViewModel = viewModel(factory = SurveyViewModelFactory()),
    onFinish: (Map<String, String>, List<QuestionUiModel>) -> Unit
) {
    val surveyState by viewModel.surveyState.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        when (val state = surveyState) {
            is SurveyState.Success -> {
                // INSTANT DATA RETRIEVAL: Find the mission from the pre-loaded global state
                val data = state.surveys.find { it.survey.id == surveyId }
                
                if (data != null) {
                    SurveyContent(
                        survey = data.survey,
                        questions = data.questions,
                        isSubmitting = isSubmitting,
                        onSubmit = { answers ->
                            onFinish(answers, data.questions)
                        }
                    )
                } else {
                    // This only shows if the ID is invalid, not during loading
                    Text("Mission data not found. Please sync from Dashboard.")
                }
            }
            is SurveyState.Error -> {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    Text(state.message, color = MaterialTheme.colorScheme.error)
                    Button(onClick = { viewModel.syncSurveys() }) { Text("Retry Sync") }
                }
            }
            else -> {
                // INITIAL LOAD ONLY: We show a spinner only once when the app first opens
                CircularProgressIndicator()
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SurveyContent(
    survey: SurveyEntity,
    questions: List<QuestionUiModel>,
    isSubmitting: Boolean,
    onSubmit: (Map<String, String>) -> Unit
) {
    var currentIndex by remember { mutableIntStateOf(0) }
    val answers = remember { mutableStateMapOf<String, String>() }

    val safeIndex = currentIndex.coerceIn(0, questions.size - 1)
    val currentQuestion = questions[safeIndex]

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(survey.title, style = MaterialTheme.typography.titleSmall) },
                actions = {
                    Text(
                        text = "${safeIndex + 1} / ${questions.size}",
                        style = MaterialTheme.typography.labelLarge,
                        fontWeight = FontWeight.Black,
                        modifier = Modifier.padding(end = 16.dp)
                    )
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
        ) {
            LinearProgressIndicator(
                progress = { (safeIndex + 1).toFloat() / questions.size },
                modifier = Modifier.fillMaxWidth().padding(bottom = 32.dp)
            )

            Text(
                text = currentQuestion.text,
                style = MaterialTheme.typography.headlineSmall,
                fontWeight = FontWeight.Black
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                currentQuestion.options.forEach { option ->
                    val selected = answers[currentQuestion.id] == option.id
                    Card(
                        onClick = { answers[currentQuestion.id] = option.id },
                        modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                        colors = CardDefaults.cardColors(
                            containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                        ),
                        shape = MaterialTheme.shapes.large
                    ) {
                        Row(
                            modifier = Modifier.padding(20.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = selected,
                                onClick = { answers[currentQuestion.id] = option.id }
                            )
                            Text(
                                text = option.text, 
                                style = MaterialTheme.typography.bodyLarge, 
                                fontWeight = if (selected) FontWeight.Bold else FontWeight.Normal,
                                modifier = Modifier.padding(start = 12.dp)
                            )
                        }
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(24.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Button(
                    onClick = { if (currentIndex > 0) currentIndex-- },
                    enabled = currentIndex > 0 && !isSubmitting,
                    modifier = Modifier.width(130.dp).height(56.dp),
                    shape = MaterialTheme.shapes.medium
                ) {
                    Text("PREVIOUS")
                }
                
                Button(
                    onClick = {
                        if (currentIndex < questions.size - 1) {
                            currentIndex++
                        } else {
                            onSubmit(answers.toMap())
                        }
                    },
                    enabled = (answers.containsKey(currentQuestion.id) || !currentQuestion.isMandatory) && !isSubmitting,
                    modifier = Modifier.width(130.dp).height(56.dp),
                    shape = MaterialTheme.shapes.medium
                ) {
                    if (isSubmitting && currentIndex == questions.size - 1) {
                        CircularProgressIndicator(modifier = Modifier.size(24.dp), color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text(if (currentIndex == questions.size - 1) "FINISH" else "NEXT")
                    }
                }
            }
        }
    }
}
