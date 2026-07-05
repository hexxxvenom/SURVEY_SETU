package com.surveysetu.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.surveysetu.app.data.SurveyEntity

data class QuestionUiModel(val id: String, val text: String, val isMandatory: Boolean, val options: List<OptionUiModel>)
data class OptionUiModel(val id: String, val text: String)
data class AnswerUiModel(val questionId: String, val selectedOptionId: String)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SurveyScreen(
    viewModel: SurveyViewModel = viewModel(factory = SurveyViewModelFactory()),
    onFinish: (Map<String, String>, List<QuestionUiModel>) -> Unit
) {
    val surveyState by viewModel.surveyState.collectAsState()
    val isSubmitting by viewModel.isSubmitting.collectAsState()

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = androidx.compose.ui.Alignment.Center
    ) {
        when (val state = surveyState) {
            is SurveyState.Loading -> {
                CircularProgressIndicator()
            }
            is SurveyState.Error -> {
                if (state.message == "ACCOUNT_LOCKED") {
                   Text("Session Expired: Device Locked", color = MaterialTheme.colorScheme.error)
                } else {
                    Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                        Text(state.message, color = MaterialTheme.colorScheme.error)
                        Spacer(modifier = Modifier.height(16.dp))
                        Button(onClick = { viewModel.syncSurveys() }) {
                            Text("Retry Sync")
                        }
                    }
                }
            }
            is SurveyState.Success -> {
                SurveyContent(
                    survey = state.survey,
                    questions = state.questions,
                    isSubmitting = isSubmitting,
                    onSubmit = { answers ->
                        onFinish(answers, state.questions)
                    }
                )
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

    val currentQuestion = questions[currentIndex]

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(survey.title) },
                actions = {
                    Text(
                        text = "Q ${currentIndex + 1}/${questions.size}",
                        style = MaterialTheme.typography.bodyMedium,
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
                progress = { (currentIndex + 1).toFloat() / questions.size },
                modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
            )

            Text(
                text = currentQuestion.text,
                style = MaterialTheme.typography.headlineMedium
            )
            
            Spacer(modifier = Modifier.height(32.dp))
            
            currentQuestion.options.forEach { option ->
                val selected = answers[currentQuestion.id] == option.id
                Card(
                    onClick = { answers[currentQuestion.id] = option.id },
                    modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
                    colors = CardDefaults.cardColors(
                        containerColor = if (selected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surfaceVariant
                    )
                ) {
                    Row(
                        modifier = Modifier.padding(16.dp),
                        verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selected,
                            onClick = { answers[currentQuestion.id] = option.id }
                        )
                        Text(text = option.text, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.padding(start = 12.dp))
                    }
                }
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Button(
                    onClick = { if (currentIndex > 0) currentIndex-- },
                    enabled = currentIndex > 0 && !isSubmitting,
                    modifier = Modifier.width(120.dp).height(48.dp)
                ) {
                    Text("Previous")
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
                    modifier = Modifier.width(120.dp).height(48.dp)
                ) {
                    if (isSubmitting && currentIndex == questions.size - 1) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text(if (currentIndex == questions.size - 1) "Finish" else "Next")
                    }
                }
            }
        }
    }
}
