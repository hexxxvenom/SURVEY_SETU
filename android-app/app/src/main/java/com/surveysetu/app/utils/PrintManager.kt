package com.surveysetu.app.utils

import android.annotation.SuppressLint
import android.bluetooth.BluetoothAdapter
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
     * ULTIMATE SEGMENTED THERMAL ENGINE V7:
     * Solves "Shrinking Text" by splitting the receipt into smaller, high-fidelity segments.
     * Prevents printer memory overflow and ensures 1:1 physical scaling.
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

            // Character limits for the constructor (standard for 203 DPI)
            val charLimit = when(paperSizeMm) { 112 -> 64; 80 -> 48; else -> 32 }
            val printer = EscPosPrinter(connection, 203, paperSizeMm.toFloat(), charLimit)

            // Target widths in physical dots
            val widthPx = when (paperSizeMm) { 112 -> 832; 80 -> 576; else -> 384 }
            
            // --- SEGMENT 1: BRANDING & RESPONDENT ---
            val headerText = "$surveyTitle\n================\nNAME: $respondentName\nMOB: $respondentContact\n================"
            val headerBitmap = generateSegmentBitmap(headerText, widthPx, selectedFont, fontSize.toFloat(), isBold = true)
            printer.printFormattedText("<img>" + PrinterTextParserImg.bitmapToHexadecimalString(printer, headerBitmap) + "</img>\n")

            // --- SEGMENT 2: QUESTIONS (One by One to prevent shrinking) ---
            questions.forEachIndexed { i, q ->
                val ans = q.options.find { it.id == answers[q.id] }?.text ?: "N/A"
                val qText = "${i + 1}. ${q.text}\nANS: $ans\n"
                val qBitmap = generateSegmentBitmap(qText, widthPx, selectedFont, fontSize.toFloat())
                printer.printFormattedText("<img>" + PrinterTextParserImg.bitmapToHexadecimalString(printer, qBitmap) + "</img>\n")
            }

            // --- SEGMENT 3: FOOTER ---
            val footerBitmap = generateSegmentBitmap("----------------\nAUTHENTICATED BY\nSURVEYSETU CLOUD", widthPx, selectedFont, (fontSize * 0.6).toFloat())
            printer.printFormattedText("<img>" + PrinterTextParserImg.bitmapToHexadecimalString(printer, footerBitmap) + "</img>\n\n\n\n")

            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    private fun generateSegmentBitmap(
        content: String,
        widthPx: Int,
        fontName: String,
        fontSize: Float,
        isBold: Boolean = false
    ): Bitmap {
        val paint = TextPaint().apply {
            color = Color.BLACK
            textSize = fontSize
            isAntiAlias = true
            typeface = Typeface.create(fontName, if (isBold) Typeface.BOLD else Typeface.NORMAL)
            style = Paint.Style.FILL_AND_STROKE
            strokeWidth = 0.5f // Slight stroke for extra darkness on thermal
        }

        val staticLayout = StaticLayout.Builder.obtain(content, 0, content.length, paint, widthPx)
            .setAlignment(Layout.Alignment.ALIGN_NORMAL)
            .setLineSpacing(0f, 1.1f)
            .build()

        val bitmap = Bitmap.createBitmap(widthPx, staticLayout.height + 20, Bitmap.Config.ARGB_8888)
        val canvas = Canvas(bitmap)
        canvas.drawColor(Color.WHITE)
        canvas.translate(0f, 10f)
        staticLayout.draw(canvas)

        return bitmap
    }
}
