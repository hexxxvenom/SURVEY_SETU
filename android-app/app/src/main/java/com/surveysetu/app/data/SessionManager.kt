package com.surveysetu.app.data

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("surveysetu_prefs", Context.MODE_PRIVATE)

    fun saveSession(token: String, deviceId: String) {
        prefs.edit()
            .putString("jwt_token", token)
            .putString("device_id", deviceId)
            .apply()
    }

    fun getToken(): String? {
        return prefs.getString("jwt_token", null)
    }

    fun getDeviceId(): String? {
        return prefs.getString("device_id", null)
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
