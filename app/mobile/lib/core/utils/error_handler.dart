import 'package:dio/dio.dart';
import 'package:easy_localization/easy_localization.dart';

class ErrorMessageHandler {
  static String getReadableError(dynamic error) {
    if (error is DioException) {
      return _handleDioError(error);
    }
    
    final errorString = error.toString();
    
    // Remove "Exception: " prefix
    String cleanError = errorString.replaceAll('Exception: ', '');
    
    // Check for common error patterns and return translated messages
    if (cleanError.contains('SocketException') || cleanError.contains('Failed host lookup')) {
      return "errors.network".tr();
    }
    
    if (cleanError.contains('Connection refused') || cleanError.contains('Connection closed')) {
      return "errors.server".tr();
    }
    
    if (cleanError.contains('Connection timeout') || cleanError.contains('Timeout')) {
      return "errors.timeout".tr();
    }
    
    if (cleanError.contains('OTP') && cleanError.contains('expired')) {
      return "errors.otp_expired".tr();
    }
    
    if (cleanError.contains('OTP') && cleanError.contains('invalid')) {
      return "errors.otp_invalid".tr();
    }
    
    if (cleanError.contains('401') || cleanError.toLowerCase().contains('unauthorized')) {
      return "errors.unauthorized".tr();
    }
    
    if (cleanError.contains('403') || cleanError.toLowerCase().contains('forbidden')) {
      return "errors.forbidden".tr();
    }
    
    if (cleanError.contains('404') || cleanError.toLowerCase().contains('not found')) {
      return "errors.not_found".tr();
    }
    
    if (cleanError.contains('500') || cleanError.contains('Internal Server Error')) {
      return "errors.internal_server".tr();
    }
    
    if (cleanError.contains('payment') && cleanError.contains('pending')) {
      return "errors.payment_pending".tr();
    }
    
    if (cleanError.contains('payment') && cleanError.contains('failed')) {
      return "errors.payment_failed".tr();
    }
    
    if (cleanError.contains('insufficient')) {
      return "errors.insufficient".tr();
    }
    
    if (cleanError.contains('already exists') || cleanError.contains('duplicate')) {
      return "errors.duplicate".tr();
    }
    
    // Return cleaned error if no pattern matched
    return cleanError.length > 100 ? '${cleanError.substring(0, 100)}...' : cleanError;
  }
  
  static String _handleDioError(DioException error) {
    switch (error.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return "errors.timeout".tr();
        
      case DioExceptionType.badResponse:
        final statusCode = error.response?.statusCode;
        final data = error.response?.data;
        
        // Try to extract error message from response
        String? serverMessage;
        if (data is Map) {
          serverMessage = data['error']?.toString() ?? 
                         data['message']?.toString() ??
                         data['detail']?.toString();
          
          // If we have a detail field, append it for debugging if it's not too long
          final detail = data['detail']?.toString();
          if (detail != null && detail.isNotEmpty && serverMessage != null && !serverMessage.contains(detail)) {
            serverMessage = "$serverMessage ($detail)";
          }
        }
        
        // If we have a detailed server message, return it (after cleaning)
        if (serverMessage != null && serverMessage.isNotEmpty) {
          return getReadableError(serverMessage);
        }
        
        // Fallback to status code messages only if no server message
        switch (statusCode) {
          case 400:
            return "errors.invalid_request".tr();
          case 401:
            return "errors.unauthorized".tr();
          case 403:
            return "errors.forbidden".tr();
          case 404:
            return "errors.not_found".tr();
          case 409:
            return "errors.duplicate".tr();
          case 422:
            return "errors.invalid_data".tr();
          case 429:
            return "errors.too_many_requests".tr();
          case 500:
          case 502:
          case 503:
            return "errors.internal_server".tr();
          default:
            return "errors.unexpected".tr();
        }
        
      case DioExceptionType.cancel:
        return "errors.cancelled".tr();
        
      case DioExceptionType.connectionError:
        return "errors.network".tr();
        
      case DioExceptionType.badCertificate:
        return "errors.security".tr();
        
      case DioExceptionType.unknown:
      default:
        if (error.message?.contains('SocketException') ?? false) {
          return "errors.network".tr();
        }
        return "errors.unexpected".tr();
    }
  }
  
  static Map<String, String> getErrorWithAction(dynamic error) {
    final message = getReadableError(error);
    String action = "errors.action_retry".tr();
    
    if (message == "errors.unauthorized".tr()) {
      action = "errors.action_login".tr();
    } else if (message == "errors.otp_expired".tr()) {
      action = "errors.action_request_otp".tr();
    } else if (message == "errors.security".tr()) {
      action = "errors.action_contact_support".tr();
    }
    
    return {
      'message': message,
      'action': action,
    };
  }
}
