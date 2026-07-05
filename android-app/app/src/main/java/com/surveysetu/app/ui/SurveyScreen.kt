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

    // DEBUG: Log the transition
    LaunchedEffect(surveyId) {
        Log.i("SurveyScreen", "Screen Initiated for ID: $surveyId")
        viewModel.loadSingleSurvey(surveyId)
    }

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        when (val state = surveyState) {
            is SurveyState.Loading -> {
                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                    CircularProgressIndicator()
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Loading Questions...", style = MaterialTheme.typography.bodySmall)
                }
            }
            is SurveyState.Error -> {
                Column(
                    modifier = Modifier.padding(32.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Text("Initialization Failed", style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.error)
                    Text(state.message, style = MaterialTheme.typography.bodySmall, modifier = Modifier.padding(vertical = 8.dp))
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.loadSingleSurvey(surveyId) }) {
                        Text("Retry Load")
                    }
                }
            }
            is SurveyState.SingleSuccess -> {
                // VERIFIED DATA: Start internal content
                SurveyContent(
                    survey = state.survey,
                    questions = state.questions,
                    isSubmitting = isSubmitting,
                    onSubmit = { answers ->
                        onFinish(answers, state.questions)
                    }
                )
            }
            is SurveyState.Success -> {
                // Dashboard state lingering, just show loader
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
    // ULTIMATE STABILITY GUARD: Handle empty questions gracefully
    if (questions.isEmpty()) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Mission contains no questions. Re-sync from Dashboard.")
        }
        return
    }

    var currentIndex by remember { mutableIntStateOf(0) }
    val answers = remember { mutableStateMapOf<String, String>() }

    // Ensure we never crash on index out of bounds
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
            
            // OPTIONS RENDERER
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
