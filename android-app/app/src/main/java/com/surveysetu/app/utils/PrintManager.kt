package com.surveysetu.app.utils

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
import android.content.Context
import android.graphics.*
import android.text.Layout
import android.text.StaticLayout
import android.text.TextPaint
import com.dantsu.escposprinter.EscPosPrinter
import com.dantsu.escposprinter.connection.bluetooth.BluetoothPrintersConnections
import com.dantsu.escposprinter.textparser.PrinterTextParserImg
import com.surveysetu.app.ui.QuestionUiModel
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

object PrintManager {

    /**
     * ULTIMATE PRINTING ENGINE V5 (FORCE-MAX):
     * Uses a massive 4.0x Power Multiplier to ensure text is physically large on paper.
     * Implements High-Contrast rendering for Thermal Sensitivity.
     */
    @SuppressLint("MissingPermission")
    suspend fun printSurveyReceipt(
        printerName: String,
        surveyTitle: String,
        respondentName: String,
        respondentContact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        paperSizeMm: Int = 58,
        selectedFont: String = "Roboto",
        fontSize: Int = 24
    ): Result<Unit> = withContext(Dispatchers.IO) {
        return@withContext try {
            val bluetoothAdapter = BluetoothAdapter.getDefaultAdapter()
            val pairedDevices = bluetoothAdapter?.bondedDevices ?: emptySet()
            val device = pairedDevices.find { it.name == printerName || it.address == printerName }
                ?: return@withContext Result.failure(Exception("Printer not found"))

            val connection = BluetoothPrintersConnections().getList()?.find { it.getDevice().address == device.address }
                ?: return@withContext Result.failure(Exception("Connection failed"))

            // Force high-density output
            val printer = EscPosPrinter(connection, 203, paperSizeMm.toFloat(), 32)
            
            // POWER MULTIPLIER: 4x Increase to combat low-DPI thermal heads
            val finalFontSize = fontSize.toFloat() * 4.0f

            val bitmap = generateReceiptBitmap(
                title = surveyTitle, 
                name = respondentName, 
                contact = respondentContact, 
                questions = questions, 
                answers = answers, 
                widthMm = paperSizeMm,
                fontName = selectedFont,
                fontSize = finalFontSize
            )

            printer.printFormattedText(
                "[C]<img>" + PrinterTextParserImg.bitmapToHexadecimalString(printer, bitmap) + "</img>\n\n\n"
            )

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun generateReceiptBitmap(
        title: String,
        name: String,
        contact: String,
        questions: List<QuestionUiModel>,
        answers: Map<String, String>,
        widthMm: Int,
        fontName: String,
        fontSize: Float
    ): Bitmap {
        // High-Resolution Canvas Targets
        val widthPx = when (widthMm) {
            112 -> 864
            80 -> 576
            else -> 384
        }
        
        val paint = TextPaint().apply {
            color = Color.BLACK
            textSize = fontSize
            isAntiAlias = true
            typeface = Typeface.create(fontName, Typeface.BOLD)
            // Enhanced darkness for thermal paper
            strokeWidth = 2f
            style = Paint.Style.FILL_AND_STROKE
        }

        val content = StringBuilder()
        content.append("$title\n")
        content.append("========================\n")
        content.append("NAME: $name\n")
        content.append("MOB: $contact\n")
        content.append("========================\n\n")
        
        questions.forEachIndexed { i, q ->
            val ans = q.options.find { it.id == answers[q.id] }?.text ?: "N/A"
            content.append("${i + 1}. ${q.text}\n")
            content.append("ANS: $ans\n\n")
        }

        val staticLayout = StaticLayout.Builder.obtain(content.toString(), 0, content.length, paint, widthPx)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.1f)
            .build()

        val bitmap = Bitmap.createBitmap(widthPx, staticLayout.height + 100, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        canvas.translate(0f, 50f)
        staticLayout.draw(canvas)

        return bitmap
    }
}
