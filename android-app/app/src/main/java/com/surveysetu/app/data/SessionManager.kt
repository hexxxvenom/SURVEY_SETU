package com.surveysetu.app.data

import android.content.Context
import android.content.SharedPreferences

class SessionManager(context: Context) {
    private val prefs: SharedPreferences = context.getSharedPreferences("surveysetu_prefs", Context.MODE_PRIVATE)

    fun saveSession(token: String, role: String, name: String, username: String) {
        prefs.edit()
            .putString("jwt_token", token)
            .putString("user_role", role)
            .putString("user_name", name)
            .putString("user_id", username)
            .apply()
    }

    fun getToken(): String? = prefs.getString("jwt_token", null)
    fun getUserRole(): String? = prefs.getString("user_role", null)
    fun getUserName(): String? = prefs.getString("user_name", null)
    fun getUserId(): String? = prefs.getString("user_id", null)

    fun getDeviceId(context: Context): String {
        return android.provider.Settings.Secure.getString(context.contentResolver, android.provider.Settings.Secure.ANDROID_ID) ?: "UNKNOWN"
    }

    fun clearSession() {
        prefs.edit().clear().apply()
    }
}
