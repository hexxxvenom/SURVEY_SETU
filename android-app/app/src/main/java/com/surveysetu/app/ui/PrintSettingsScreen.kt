package com.surveysetu.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalLayoutApi::class, ExperimentalMaterial3Api::class)
@Composable
fun PrintSettingsScreen(
    surveyLanguage: String,
    currentPaperSize: Int,
    currentFontName: String,
    currentFontSize: Int,
    onPrint: (Int, String, Int) -> Unit
) {
    var paperSize by remember { mutableIntStateOf(currentPaperSize) }
    var fontSize by remember { mutableIntStateOf(currentFontSize) }
    
    val hindiFonts = listOf("Mangal", "KrutiDev", "Kokila", "Utsaah", "Aparajita")
    val englishFonts = listOf("Roboto", "Montserrat", "OpenSans", "Lato", "Playfair")

    val isHindi = surveyLanguage.contains("hi", ignoreCase = true) || surveyLanguage.contains("hindi", ignoreCase = true)
    val availableFonts = if (isHindi) hindiFonts else englishFonts
    
    var selectedFont by remember { 
        mutableStateOf(if (availableFonts.contains(currentFontName)) currentFontName else availableFonts.first()) 
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Advanced Print Wizard") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
        ) {
            LazyColumn(modifier = Modifier.weight(1f)) {
                // AUTO-DETECTION BADGE
                item {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                        shape = MaterialTheme.shapes.medium,
                        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
                    ) {
                        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
                            val langLabel = if (isHindi) "HINDI (Detected)" else "ENGLISH (Detected)"
                            Text("Language: ", style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                            Text(langLabel, style = MaterialTheme.typography.labelSmall, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Black)
                        }
                    }
                }

                // 1. Paper Size (Added 112mm / 4-inch)
                item {
                    Text("1. Paper Width", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        FilterChip(selected = paperSize == 58, onClick = { paperSize = 58 }, label = { Text("2\" (58mm)") }, modifier = Modifier.padding(end = 8.dp))
                        FilterChip(selected = paperSize == 80, onClick = { paperSize = 80 }, label = { Text("3\" (80mm)") }, modifier = Modifier.padding(end = 8.dp))
                        FilterChip(selected = paperSize == 112, onClick = { paperSize = 112 }, label = { Text("4\" (112mm)") })
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), thickness = 0.5.dp)
                }

                // 2. Font Selection
                item {
                    Text("2. Select Font", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp), maxItemsInEachRow = 3) {
                        availableFonts.forEach { font ->
                            FilterChip(
                                selected = selectedFont == font,
                                onClick = { selectedFont = font },
                                label = { Text(font) },
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), thickness = 0.5.dp)
                }

                // 3. Font Size (Expanded to include Extra Large and Jumbo)
                item {
                    Text("3. Font Size (Scalable)", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf(18, 24, 32, 40, 48).forEach { size ->
                            val label = when(size) { 
                                18 -> "S"; 24 -> "M"; 32 -> "L"; 40 -> "XL"; else -> "XXL" 
                            }
                            FilterChip(
                                selected = fontSize == size,
                                onClick = { fontSize = size },
                                label = { Text(label) },
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                    Text(text = "Current Scale: ${fontSize}sp", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }

                // 4. LIVE PREVIEW
                item {
                    Spacer(modifier = Modifier.height(32.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("DYNAMIC RECEIPT PREVIEW", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                            Spacer(modifier = Modifier.height(12.dp))
                            val previewText = if (isHindi) "मिशन रिकॉर्ड" else "MISSION RECORD"
                            // Scaling the preview to match relative size
                            Text(previewText, fontSize = (fontSize/1.5).sp, fontWeight = FontWeight.Black, color = Color.Black)
                            Text("--------------------------", color = Color.Gray)
                            Text("Respondent: Amit Kumar", fontSize = (fontSize/2).sp, color = Color.Black)
                            val qPreview = if (isHindi) "1. ऊर्जा का मुख्य स्रोत?" else "1. Primary Energy Source?"
                            val aPreview = if (isHindi) "उत्तर: सौर ऊर्जा" else "Ans: Solar Power"
                            Text(qPreview, fontSize = (fontSize/2).sp, color = Color.Black)
                            Text(aPreview, fontSize = (fontSize/2).sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        }
                    }
                }
            }

            Button(
                onClick = { onPrint(paperSize, selectedFont, fontSize) },
                modifier = Modifier.fillMaxWidth().height(64.dp).padding(top = 16.dp),
                shape = MaterialTheme.shapes.large,
                colors = ButtonDefaults.buttonColors(containerColor = MaterialTheme.colorScheme.primary)
            ) {
                Text("SAVE & ACTIVATE PRINT", fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            }
        }
    }
}
