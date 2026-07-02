package com.surveysetu.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.lifecycle.viewmodel.compose.viewModel
import com.surveysetu.app.data.SurveyEntity

@Composable
fun SurveyScreen(
    viewModel: SurveyViewModel = viewModel(),
    onFinish: () -> Unit
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
                Column(horizontalAlignment = androidx.compose.ui.Alignment.CenterHorizontally) {
                    Text(state.message, color = MaterialTheme.colorScheme.error)
                    Spacer(modifier = Modifier.height(16.dp))
                    Button(onClick = { viewModel.loadLocalSurvey() }) {
                        Text("Retry")
                    }
                }
            }
            is SurveyState.Success -> {
                SurveyContent(
                    survey = state.survey,
                    questions = state.questions,
                    isSubmitting = isSubmitting,
                    onSubmit = { answers ->
                        // photoPath and GPS are currently mocked/placeholders for this view layer
                        viewModel.submitSurvey(state.survey, answers, null, null, onFinish)
                    }
                )
            }
        }
    }
}

@Composable
private fun SurveyContent(
    survey: SurveyEntity,
    questions: List<QuestionUiModel>,
    isSubmitting: Boolean,
    onSubmit: (List<AnswerUiModel>) -> Unit
) {
    var currentIndex by remember { mutableStateOf(0) }
    val answers = remember { mutableStateMapOf<String, String>() }

    val currentQuestion = questions[currentIndex]

    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = androidx.compose.ui.Alignment.TopCenter
    ) {
        Column(
            modifier = Modifier
                .widthIn(max = 600.dp)
                .fillMaxHeight()
                .padding(16.dp)
        ) {
            Text(
                text = "Question ${currentIndex + 1} of ${questions.size}",
                style = MaterialTheme.typography.titleMedium,
                color = MaterialTheme.colorScheme.primary
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Text(
                text = currentQuestion.text,
                style = MaterialTheme.typography.headlineSmall
            )
            
            Spacer(modifier = Modifier.height(24.dp))
            
            currentQuestion.options.forEach { option ->
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalAlignment = androidx.compose.ui.Alignment.CenterVertically
                ) {
                    RadioButton(
                        selected = answers[currentQuestion.id] == option.id,
                        onClick = { answers[currentQuestion.id] = option.id }
                    )
                    Text(text = option.text, modifier = Modifier.padding(start = 8.dp))
                }
            }
            
            Spacer(modifier = Modifier.weight(1f))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Button(
                    onClick = { if (currentIndex > 0) currentIndex-- },
                    enabled = currentIndex > 0 && !isSubmitting
                ) {
                    Text("Previous")
                }
                
                Button(
                    onClick = {
                        if (currentIndex < questions.size - 1) {
                            currentIndex++
                        } else {
                            val answerList = answers.map { AnswerUiModel(it.key, it.value) }
                            onSubmit(answerList)
                        }
                    },
                    enabled = (answers.containsKey(currentQuestion.id) || !currentQuestion.isMandatory) && !isSubmitting
                ) {
                    if (isSubmitting && currentIndex == questions.size - 1) {
                        CircularProgressIndicator(modifier = Modifier.size(20.dp), color = MaterialTheme.colorScheme.onPrimary)
                    } else {
                        Text(if (currentIndex == questions.size - 1) "Submit" else "Next")
                    }
                }
            }
        }
    }
}

data class QuestionUiModel(val id: String, val text: String, val isMandatory: Boolean, val options: List<OptionUiModel>)
data class OptionUiModel(val id: String, val text: String)
data class AnswerUiModel(val questionId: String, val selectedOptionId: String)
