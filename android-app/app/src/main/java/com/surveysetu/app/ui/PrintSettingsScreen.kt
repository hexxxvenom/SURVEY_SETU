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
    surveyLanguage: String, // "en" or "hi"
    currentPaperSize: Int,
    currentFontName: String,
    currentFontSize: Int,
    onPrint: (Int, String, Int) -> Unit
) {
    var paperSize by remember { mutableIntStateOf(currentPaperSize) }
    var fontSize by remember { mutableIntStateOf(currentFontSize) }
    
    val hindiFonts = listOf("Mangal", "KrutiDev", "Kokila", "Utsaah", "Aparajita")
    val englishFonts = listOf("Roboto", "Montserrat", "OpenSans", "Lato", "Playfair")

    // STRICT LANGUAGE DETECTION: Ensuring "en" is never treated as "hi"
    val isHindi = surveyLanguage.lowercase() == "hi" || surveyLanguage.lowercase() == "hindi"
    val availableFonts = if (isHindi) hindiFonts else englishFonts
    
    var selectedFont by remember { 
        mutableStateOf(if (availableFonts.contains(currentFontName)) currentFontName else availableFonts.first()) 
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Master Print Control") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
        ) {
            LazyColumn(modifier = Modifier.weight(1f)) {
                // STATUS PANEL
                item {
                    Surface(
                        color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.5f),
                        shape = MaterialTheme.shapes.medium,
                        modifier = Modifier.fillMaxWidth().padding(bottom = 24.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp)) {
                            val langLabel = if (isHindi) "🇮🇳 HINDI MODE" else "🇬🇧 ENGLISH MODE"
                            Text("Automatic Optimization Active", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                            Text(langLabel, style = MaterialTheme.typography.titleMedium, color = MaterialTheme.colorScheme.primary, fontWeight = FontWeight.Black)
                            Text("Metadata: [CODE: $surveyLanguage]", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                        }
                    }
                }

                // 1. Paper Width (Expanded Labels)
                item {
                    Text("Select Roll Width", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf(58 to "2\"", 80 to "3\"", 112 to "4\"").forEach { (valSize, label) ->
                            FilterChip(
                                selected = paperSize == valSize, 
                                onClick = { paperSize = valSize }, 
                                label = { Text("$label ($valSize mm)") }, 
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), thickness = 0.5.dp)
                }

                // 2. Premium Fonts
                item {
                    Text("Available Premium Fonts", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
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

                // 3. Font Size (Expanded Scales: Now with Giant and Super Jumbo)
                item {
                    Text("Global Text Scale", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp)) {
                        // Using a higher SP scale for UI, but backend now applies a 2.5x multiplier
                        listOf(24, 32, 40, 56, 72).forEach { size ->
                            val label = when(size) { 
                                24 -> "Regular"; 32 -> "Large"; 40 -> "XL"; 56 -> "XXL"; else -> "GIANT" 
                            }
                            FilterChip(
                                selected = fontSize == size,
                                onClick = { fontSize = size },
                                label = { Text(label) },
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                    Text(text = "Rendering at: ${fontSize * 2.5} High-Resolution Pixels", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                }

                // 4. PREVIEW
                item {
                    Spacer(modifier = Modifier.height(32.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(20.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("RECEIPT FIDELITY PREVIEW", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                            Spacer(modifier = Modifier.height(16.dp))
                            val previewText = if (isHindi) "राष्ट्रीय सर्वेक्षण 2026" else "NATIONAL MISSION 2026"
                            Text(previewText, fontSize = (fontSize/1.2).sp, fontWeight = FontWeight.Black, color = Color.Black)
                            Text("==========================", color = Color.Gray)
                            Text("NAME: RAJESH KUMAR", fontSize = (fontSize/2).sp, fontWeight = FontWeight.Bold, color = Color.Black)
                            val qPreview = if (isHindi) "1. आपका मुख्य व्यवसाय?" else "1. Primary Occupation?"
                            val aPreview = if (isHindi) "उत्तर: कृषि" else "Ans: Farming"
                            Text(qPreview, fontSize = (fontSize/2.5).sp, color = Color.Black)
                            Text(aPreview, fontSize = (fontSize/2.5).sp, fontWeight = FontWeight.Bold, color = Color.Black)
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
                Text("SAVE & EXECUTE PRINT", fontWeight = FontWeight.Black, letterSpacing = 1.sp)
            }
        }
    }
}
