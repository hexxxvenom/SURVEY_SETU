package com.surveysetu.app.ui

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PrintSettingsScreen(
    onPrint: (Int, Int) -> Unit // paperSize, fontSize
) {
    var paperSize by remember { mutableStateOf(58) } // 58mm, 80mm
    var fontSize by remember { mutableStateOf(24) } // small, medium, large

    Scaffold(
        topBar = { TopAppBar(title = { Text("Print Settings") }) }
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

            Text("Select Font Size", style = MaterialTheme.typography.titleMedium)
            Row {
                FilterChip(selected = fontSize == 18, onClick = { fontSize = 18 }, label = { Text("Small") })
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(selected = fontSize == 24, onClick = { fontSize = 24 }, label = { Text("Medium") })
                Spacer(modifier = Modifier.width(8.dp))
                FilterChip(selected = fontSize == 32, onClick = { fontSize = 32 }, label = { Text("Large") })
            }

            Spacer(modifier = Modifier.weight(1f))

            Button(
                onClick = { onPrint(paperSize, fontSize) },
                modifier = Modifier.fillMaxWidth().height(56.dp)
            ) {
                Text("Proceed to Printer Selection")
            }
        }
    }
}
