package com.surveysetu.app.ui

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.surveysetu.app.data.DatabaseProvider
import com.surveysetu.app.data.LoginRequest
import com.surveysetu.app.data.RetrofitClient
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch

sealed class LoginState {
    object Idle : LoginState()
    object Loading : LoginState()
    data class Success(val token: String, val role: String) : LoginState()
    data class Error(val message: String) : LoginState()
}

class LoginViewModel : ViewModel() {
    private val _loginState = MutableStateFlow<LoginState>(LoginState.Idle)
    val loginState: StateFlow<LoginState> = _loginState.asStateFlow()

    fun login(username: String, password: String, deviceId: String) {
        if (username.isBlank() || password.isBlank() || deviceId.isBlank()) {
            _loginState.value = LoginState.Error("Please fill in all fields")
            return
        }

        _loginState.value = LoginState.Loading

        viewModelScope.launch {
            try {
                val request = LoginRequest(username, password, deviceId)
                val response = RetrofitClient.apiService.login(request)
                
                if (response.isSuccessful && response.body() != null) {
                    val body = response.body()!!
                    
                    // Save real session data (Role, Name, Username)
                    DatabaseProvider.sessionManager.saveSession(
                        token = body.token, 
                        role = body.role,
                        name = body.name,
                        username = body.username
                    )
                    RetrofitClient.authToken = body.token
                    
                    _loginState.value = LoginState.Success(body.token, body.role)
                } else {
                    val errorString = response.errorBody()?.string() ?: "Unknown error"
                    _loginState.value = LoginState.Error("Login failed: $errorString")
                }
            } catch (e: Exception) {
                _loginState.value = LoginState.Error(e.localizedMessage ?: "Network error")
            }
        }
    }
    
    fun resetState() {
        _loginState.value = LoginState.Idle
    }
}
