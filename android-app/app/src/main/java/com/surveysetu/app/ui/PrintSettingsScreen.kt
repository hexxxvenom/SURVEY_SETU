package com.surveysetu.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrintSettingsScreen(
    onPrint: (Int, String) -> Unit // paperSize, fontName
) {
    var paperSize by remember { mutableIntStateOf(58) }
    var selectedFont by remember { mutableStateOf("Mangal") }

    val hindiFonts = listOf("Mangal", "KrutiDev", "Kokila", "Utsaah", "Aparajita")
    val englishFonts = listOf("Roboto", "Montserrat", "OpenSans", "Lato", "Playfair")

    Scaffold(
        topBar = { TopAppBar(title = { Text("World-Class Print Settings") }) }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(32.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text("Select Paper Width", style = MaterialTheme.typography.titleMedium)
            Row {
                FilterChip(
                    selected = paperSize == 58,
                    onClick = { paperSize = 58 },
                    label = { Text("2-inch (58mm)") }
                )
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(
                    selected = paperSize == 80,
                    onClick = { paperSize = 80 },
                    label = { Text("3-inch (80mm)") }
                )
            }

            Spacer(modifier = Modifier.height(32.dp))

            Text("Premium Hindi Fonts", style = MaterialTheme.typography.titleMedium)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                hindiFonts.take(3).forEach { font ->
                    FilterChip(selected = selectedFont == font, onClick = { selectedFont = font }, label = { Text(font) })
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                hindiFonts.drop(3).forEach { font ->
                    FilterChip(selected = selectedFont == font, onClick = { selectedFont = font }, label = { Text(font) })
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            Text("Premium English Fonts", style = MaterialTheme.typography.titleMedium)
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                englishFonts.take(3).forEach { font ->
                    FilterChip(selected = selectedFont == font, onClick = { selectedFont = font }, label = { Text(font) })
                }
            }
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceEvenly) {
                englishFonts.drop(3).forEach { font ->
                    FilterChip(selected = selectedFont == font, onClick = { selectedFont = font }, label = { Text(font) })
                }
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { onPrint(paperSize, selectedFont) },
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Text("Start Full-Width Printing")
            }
        }
    }
}
