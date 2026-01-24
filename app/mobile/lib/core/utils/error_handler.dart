import 'package:dio/dio.dart';

class ErrorMessageHandler {
  static String getReadableError(dynamic error) {
    if (error is DioException) {
      return _handleDioError(error);
    }
    
    final errorString = error.toString();
    
    // Remove "Exception: " prefix
    String cleanError = errorString.replaceAll('Exception: ', '');
    
    // Check for common error patterns and return user-friendly messages
    if (cleanError.contains('SocketException') || cleanError.contains('Failed host lookup')) {
      return "Network is unstable. Please check your connection and try again.";
    }
    
    if (cleanError.contains('Connection refused') || cleanError.contains('Connection closed')) {
      return "Unable to connect to server. Please try again later.";
    }
    
    if (cleanError.contains('Connection timeout') || cleanError.contains('Timeout')) {
      return "Request timed out. Please check your connection and try again.";
    }
    
    if (cleanError.contains('OTP') && cleanError.contains('expired')) {
      return "OTP code has expired. Please request a new one.";
    }
    
    if (cleanError.contains('OTP') && cleanError.contains('invalid')) {
      return "Invalid OTP code. Please check and try again.";
    }
    
    if (cleanError.contains('401') || cleanError.toLowerCase().contains('unauthorized')) {
      return "Session expired. Please login again.";
    }
    
    if (cleanError.contains('403') || cleanError.toLowerCase().contains('forbidden')) {
      return "You don't have permission to perform this action.";
    }
    
    if (cleanError.contains('404') || cleanError.toLowerCase().contains('not found')) {
      return "Requested resource not found.";
    }
    
    if (cleanError.contains('500') || cleanError.contains('Internal Server Error')) {
      return "Server error occurred. Please try again later.";
    }
    
    if (cleanError.contains('payment') && cleanError.contains('pending')) {
      return "Payment verification is pending. Please check back in a few minutes.";
    }
    
    if (cleanError.contains('payment') && cleanError.contains('failed')) {
      return "Payment failed. Please verify your payment details and try again.";
    }
    
    if (cleanError.contains('insufficient')) {
      return "Insufficient balance or capacity. Please check and try again.";
    }
    
    if (cleanError.contains('already exists') || cleanError.contains('duplicate')) {
      return "This item already exists. Please try with different details.";
    }
    
    // Return cleaned error if no pattern matched
    return cleanError.length > 100 ? '${cleanError.substring(0, 100)}...' : cleanError;
  }
  
  static String _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return "Request timed out. Please check your connection and try again.";
        
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final data = error.response?.data;
        
        // Try to extract error message from response
        String? serverMessage;
        if (data is Map) {
          serverMessage = data['error']?.toString() ?? 
                         data['message']?.toString() ??
                         data['detail']?.toString();
        }
        
        if (serverMessage != null && serverMessage.isNotEmpty) {
          return getReadableError(serverMessage);
        }
        
        // Fallback to status code messages
        switch (statusCode) {
          case 400:
            return "Invalid request. Please check your input and try again.";
          case 401:
            return "Session expired. Please login again.";
          case 403:
            return "You don't have permission to perform this action.";
          case 404:
            return "Requested resource not found.";
          case 409:
            return "Conflict occurred. This item may already exist.";
          case 422:
            return "Invalid data provided. Please check and try again.";
          case 429:
            return "Too many requests. Please wait a moment and try again.";
          case 500:
          case 502:
          case 503:
            return "Server error occurred. Please try again later.";
          default:
            return "An error occurred (Code: $statusCode). Please try again.";
        }
        
      case DioExceptionType.cancel:
        return "Request was cancelled.";
        
      case DioExceptionType.connectionError:
        return "Network is unstable. Please check your connection and try again.";
        
      case DioExceptionType.badCertificate:
        return "Security certificate error. Please contact support.";
        
      case DioExceptionType.unknown:
      default:
        if (error.message?.contains('SocketException') ?? false) {
          return "Network is unstable. Please check your connection and try again.";
        }
        return "An unexpected error occurred. Please try again.";
    }
  }
  
  static Map<String, String> getErrorWithAction(dynamic error) {
    final message = getReadableError(error);
    String action = "Try Again";
    
    if (message.contains("Session expired") || message.contains("login again")) {
      action = "Login";
    } else if (message.contains("OTP") && message.contains("request")) {
      action = "Request New OTP";
    } else if (message.contains("contact support")) {
      action = "Contact Support";
    }
    
    return {
      'message': message,
      'action': action,
    };
  }
}
