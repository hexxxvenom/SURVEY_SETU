package com.surveysetu.app.ui

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.selection.selectable
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrintSettingsScreen(
    onPrint: (Int, String, String, Int) -> Unit // paperSize, fontName, languageMode, fontSize
) {
    var paperSize by remember { mutableIntStateOf(58) }
    var languageMode by remember { mutableStateOf("English") } // English, Hindi, Bilingual
    var selectedFont by remember { mutableStateOf("Roboto") }
    var fontSize by remember { mutableIntStateOf(24) }

    val hindiFonts = listOf("Mangal", "KrutiDev", "Kokila", "Utsaah", "Aparajita")
    val englishFonts = listOf("Roboto", "Montserrat", "OpenSans", "Lato", "Playfair")

    // Update default font when language changes
    LaunchedEffect(languageMode) {
        selectedFont = if (languageMode == "Hindi") "Mangal" else "Roboto"
    }

    Scaffold(
        topBar = { TopAppBar(title = { Text("Print Wizard") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(24.dp)
        ) {
            LazyColumn(modifier = Modifier.weight(1f)) {
                // 1. Paper Size
                item {
                    Text("1. Paper Width", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    Row(modifier = Modifier.padding(vertical = 8.dp)) {
                        FilterChip(selected = paperSize == 58, onClick = { paperSize = 58 }, label = { Text("2-inch (58mm)") })
                        Spacer(modifier = Modifier.width(8.dp))
                        FilterChip(selected = paperSize == 80, onClick = { paperSize = 80 }, label = { Text("3-inch (80mm)") })
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), thickness = 0.5.dp)
                }

                // 2. Language Selection
                item {
                    Text("2. Document Language", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    Row(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf("English", "Hindi", "Bilingual").forEach { mode ->
                            FilterChip(
                                selected = languageMode == mode,
                                onClick = { languageMode = mode },
                                label = { Text(mode) },
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                    HorizontalDivider(modifier = Modifier.padding(vertical = 16.dp), thickness = 0.5.dp)
                }

                // 3. Font Selection (Conditional)
                item {
                    val currentFonts = if (languageMode == "Hindi") hindiFonts else englishFonts
                    Text("3. Typography Style", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    FlowRow(modifier = Modifier.padding(vertical = 8.dp), maxItemsInEachRow = 3) {
                        currentFonts.forEach { font ->
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

                // 4. Font Size
                item {
                    Text("4. Text Scale", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Black)
                    Row(modifier = Modifier.padding(vertical = 8.dp)) {
                        listOf(18, 24, 32).forEach { size ->
                            val label = when(size) { 18 -> "Small"; 24 -> "Medium"; else -> "Large" }
                            FilterChip(
                                selected = fontSize == size,
                                onClick = { fontSize = size },
                                label = { Text(label) },
                                modifier = Modifier.padding(end = 8.dp)
                            )
                        }
                    }
                }

                // 5. MINI PREVIEW (World-Class UX)
                item {
                    Spacer(modifier = Modifier.height(24.dp))
                    Card(
                        modifier = Modifier.fillMaxWidth(),
                        colors = CardDefaults.cardColors(containerColor = Color.White),
                        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                    ) {
                        Column(modifier = Modifier.padding(16.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
                            Text("LIVE PRINT PREVIEW", style = MaterialTheme.typography.labelSmall, color = Color.LightGray)
                            Spacer(modifier = Modifier.height(8.dp))
                            Text("MISSION RECORD", fontSize = (fontSize/1.5).sp, fontWeight = FontWeight.Black, color = Color.Black)
                            Text("--------------------------", color = Color.Gray)
                            Text("Respondent: Amit Kumar", fontSize = (fontSize/2).sp, color = Color.Black)
                            Text("1. Primary Source of Energy?", fontSize = (fontSize/2).sp, color = Color.Black)
                            Text("   Ans: Solar / सौर ऊर्जा", fontSize = (fontSize/2).sp, fontWeight = FontWeight.Bold, color = Color.Black)
                        }
                    }
                }
            }

            Button(
                onClick = { onPrint(paperSize, selectedFont, languageMode, fontSize) },
                modifier = Modifier.fillMaxWidth().height(56.dp).padding(top = 16.dp),
                shape = MaterialTheme.shapes.large
            ) {
                Text("EXECUTE CLOUD PRINT", fontWeight = FontWeight.Black, letterSpacing = 2.sp)
            }
        }
    }
}
