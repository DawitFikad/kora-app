import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';
import 'package:url_launcher/url_launcher.dart';

class InAppPaymentScreen extends StatefulWidget {
  final String paymentUrl;
  final String paymentMethod;

  const InAppPaymentScreen({
    super.key,
    required this.paymentUrl,
    required this.paymentMethod,
  });

  @override
  State<InAppPaymentScreen> createState() => _InAppPaymentScreenState();
}

class _InAppPaymentScreenState extends State<InAppPaymentScreen> {
  WebViewController? _controller;
  int _progress = 0;

  bool get _supportsEmbeddedWebView {
    if (kIsWeb) return false;
    return defaultTargetPlatform == TargetPlatform.android ||
        defaultTargetPlatform == TargetPlatform.iOS;
  }

  Future<void> _openInBrowser() async {
    final uri = Uri.parse(widget.paymentUrl);
    final mode = kIsWeb
        ? LaunchMode.platformDefault
        : LaunchMode.externalApplication;
    final launched = await launchUrl(uri, mode: mode);
    if (launched) {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Opened payment in browser.'),
          duration: Duration(seconds: 2),
        ),
      );
    } else {
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Unable to open browser for this payment link.'),
          backgroundColor: Colors.red,
        ),
      );
    }
  }

  @override
  void initState() {
    super.initState();

    if (!_supportsEmbeddedWebView) {
      return;
    }

    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (progress) {
            if (!mounted) return;
            setState(() => _progress = progress);
          },
          onNavigationRequest: (request) {
            final url = request.url.toLowerCase();

            // Detect successful payment or verification callbacks.
            if (url.contains('verify-callback') ||
                url.contains('payment-success') ||
                url.contains('status=success') ||
                url.contains('result=success')) {
              Navigator.pop(context, true);
              return NavigationDecision.prevent;
            }

            // Detect cancellation/failure paths.
            if (url.contains('cancel') ||
                url.contains('status=failed') ||
                url.contains('status=cancelled') ||
                url.contains('result=failed')) {
              Navigator.pop(context, false);
              return NavigationDecision.prevent;
            }

            return NavigationDecision.navigate;
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.paymentUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: const Color(0xFF0F0D15),
      appBar: AppBar(
        title: Text('${widget.paymentMethod} Payment'),
        backgroundColor: Colors.transparent,
        foregroundColor: Colors.white,
        elevation: 0,
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 8),
            child: Row(
              children: [
                Container(
                  padding: const EdgeInsets.symmetric(
                    horizontal: 10,
                    vertical: 6,
                  ),
                  decoration: BoxDecoration(
                    color: const Color(0xFF10B981).withValues(alpha: 0.15),
                    borderRadius: BorderRadius.circular(999),
                    border: Border.all(
                      color: const Color(0xFF10B981).withValues(alpha: 0.35),
                    ),
                  ),
                  child: const Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Icon(
                        Icons.lock_outline,
                        color: Color(0xFF10B981),
                        size: 14,
                      ),
                      SizedBox(width: 6),
                      Text(
                        'Secure Telebirr in-app checkout',
                        style: TextStyle(
                          color: Color(0xFF10B981),
                          fontSize: 11,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ],
                  ),
                ),
                const Spacer(),
                TextButton.icon(
                  onPressed: _openInBrowser,
                  icon: const Icon(Icons.open_in_browser, size: 16),
                  label: const Text('Open in Browser'),
                  style: TextButton.styleFrom(
                    foregroundColor: Colors.white70,
                    textStyle: const TextStyle(fontSize: 12),
                  ),
                ),
              ],
            ),
          ),
          if (_progress < 100)
            LinearProgressIndicator(
              value: _progress / 100,
              minHeight: 2,
              backgroundColor: Colors.white10,
              color: const Color(0xFFFF0000),
            ),
          Expanded(
            child: _supportsEmbeddedWebView
                ? WebViewWidget(controller: _controller!)
                : Center(
                    child: Padding(
                      padding: const EdgeInsets.all(24),
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          const Icon(
                            Icons.open_in_browser,
                            color: Colors.white70,
                            size: 48,
                          ),
                          const SizedBox(height: 16),
                          const Text(
                            'In-app checkout is not available on this platform.',
                            textAlign: TextAlign.center,
                            style: TextStyle(color: Colors.white, fontSize: 16),
                          ),
                          const SizedBox(height: 8),
                          const Text(
                            'Use your browser to complete payment securely.',
                            textAlign: TextAlign.center,
                            style: TextStyle(
                              color: Colors.white70,
                              fontSize: 13,
                            ),
                          ),
                          const SizedBox(height: 16),
                          ElevatedButton.icon(
                            onPressed: _openInBrowser,
                            icon: const Icon(Icons.open_in_new),
                            label: const Text('Continue in Browser'),
                          ),
                        ],
                      ),
                    ),
                  ),
          ),
        ],
      ),
    );
  }
}
