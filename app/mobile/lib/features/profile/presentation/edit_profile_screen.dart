import 'dart:convert';
import 'dart:io';
import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:image_picker/image_picker.dart';
import 'package:easy_localization/easy_localization.dart';
import '../services/profile_service.dart';
import 'package:mobile/core/utils/avatar_image_provider.dart';

class EditProfileScreen extends ConsumerStatefulWidget {
  const EditProfileScreen({super.key});

  @override
  ConsumerState<EditProfileScreen> createState() => _EditProfileScreenState();
}

class _EditProfileScreenState extends ConsumerState<EditProfileScreen> {
  final _formKey = GlobalKey<FormState>();
  late TextEditingController _nameController;
  late TextEditingController _emailController;
  late TextEditingController _bioController;
  late TextEditingController _locationController;
  late TextEditingController _interestsController;
  String? _selectedLanguage;
  String? _selectedGender;
  DateTime? _selectedBirthDate;
  String? _avatarBase64;
  File? _imageFile;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    final profile = ref.read(userProfileProvider).value;
    _nameController = TextEditingController(text: profile?.fullName);
    _emailController = TextEditingController(text: profile?.email);
    _bioController = TextEditingController(text: profile?.bio);
    _locationController = TextEditingController(text: profile?.location);
    _interestsController = TextEditingController(
      text: (profile?.interests ?? const []).join(', '),
    );
    _selectedGender = profile?.gender;
    _selectedBirthDate = profile?.birthDate;
    _selectedLanguage = profile?.language ?? 'en';
  }

  @override
  void dispose() {
    _nameController.dispose();
    _emailController.dispose();
    _bioController.dispose();
    _locationController.dispose();
    _interestsController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final pickedFile = await picker.pickImage(
      source: ImageSource.gallery,
      imageQuality: 50,
    );

    if (pickedFile != null) {
      final bytes = await pickedFile.readAsBytes();
      setState(() {
        _imageFile = File(pickedFile.path);
        _avatarBase64 = 'data:image/jpeg;base64,${base64Encode(bytes)}';
      });
    }
  }

  Future<void> _saveProfile() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isLoading = true);

    try {
      final updatedData = {
        'fullName': _nameController.text,
        'email': _emailController.text,
        'bio': _bioController.text,
        'location': _locationController.text,
        'interests': _interestsController.text
            .split(',')
            .map((e) => e.trim())
            .where((e) => e.isNotEmpty)
            .toList(),
        'gender': _selectedGender,
        'birthDate': _selectedBirthDate?.toIso8601String(),
        'language': _selectedLanguage,
        if (_avatarBase64 != null) 'avatarUrl': _avatarBase64,
      };

      await ref.read(profileServiceProvider).updateProfile(updatedData);

      // Refresh profile data
      ref.invalidate(userProfileProvider);

      if (mounted) {
        ScaffoldMessenger.of(
          context,
        ).showSnackBar(SnackBar(content: Text('profile.update_success'.tr())));
        Navigator.pop(context);
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('${'common.error'.tr()}: $e'),
            backgroundColor: Colors.red,
          ),
        );
      }
    } finally {
      if (mounted) setState(() => _isLoading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final isDark = Theme.of(context).brightness == Brightness.dark;
    final textColor = isDark ? Colors.white : const Color(0xFF1A1823);
    final cardColor = isDark ? const Color(0xFF232030) : Colors.white;
    final inputColor = isDark ? const Color(0xFF2E2A3D) : Colors.grey[100];

    return Scaffold(
      backgroundColor: isDark
          ? const Color(0xFF15131C)
          : const Color(0xFFF8F7FA),
      appBar: AppBar(
        title: Text(
          'profile.edit_profile_title'.tr(),
          style: GoogleFonts.poppins(
            fontWeight: FontWeight.bold,
            color: textColor,
          ),
        ),
        backgroundColor: Colors.transparent,
        elevation: 0,
        leading: IconButton(
          icon: Icon(Icons.arrow_back, color: textColor),
          onPressed: () => Navigator.pop(context),
        ),
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(24),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Avatar edit
              Center(
                child: Stack(
                  children: [
                    Container(
                      padding: const EdgeInsets.all(4),
                      decoration: BoxDecoration(
                        shape: BoxShape.circle,
                        border: Border.all(
                          color: const Color(0xFFFF0000),
                          width: 2,
                        ),
                      ),
                      child: CircleAvatar(
                        radius: 60,
                        backgroundColor: Colors.grey[800],
                        backgroundImage: _imageFile != null
                            ? FileImage(_imageFile!) as ImageProvider
                            : avatarImageProvider(
                                ref.read(userProfileProvider).value?.avatarUrl,
                              ),
                        child:
                            (_imageFile == null &&
                                ref
                                        .read(userProfileProvider)
                                        .value
                                        ?.avatarUrl ==
                                    null)
                            ? const Icon(
                                Icons.person,
                                size: 60,
                                color: Colors.white,
                              )
                            : null,
                      ),
                    ),
                    Positioned(
                      bottom: 0,
                      right: 0,
                      child: GestureDetector(
                        onTap: _pickImage,
                        child: Container(
                          padding: const EdgeInsets.all(8),
                          decoration: const BoxDecoration(
                            color: Color(0xFFFF0000),
                            shape: BoxShape.circle,
                          ),
                          child: const Icon(
                            Icons.camera_alt,
                            color: Colors.white,
                            size: 20,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
              ),
              const SizedBox(height: 32),

              _buildLabel("profile.full_name".tr()),
              _buildTextField(
                controller: _nameController,
                hint: "profile.full_name_hint".tr(),
                backgroundColor: inputColor!,
                textColor: textColor,
              ),
              const SizedBox(height: 20),

              _buildLabel("profile.email_address".tr()),
              _buildTextField(
                controller: _emailController,
                hint: "profile.email_hint".tr(),
                backgroundColor: inputColor,
                textColor: textColor,
                keyboardType: TextInputType.emailAddress,
              ),
              const SizedBox(height: 20),

              _buildLabel("profile.bio".tr()),
              _buildTextField(
                controller: _bioController,
                hint: "profile.bio_hint".tr(),
                backgroundColor: inputColor,
                textColor: textColor,
                maxLines: 3,
              ),
              const SizedBox(height: 20),

              _buildLabel("Location"),
              _buildTextField(
                controller: _locationController,
                hint: "City or area (for nearby event alerts)",
                backgroundColor: inputColor,
                textColor: textColor,
              ),
              const SizedBox(height: 20),

              _buildLabel("Interests"),
              _buildTextField(
                controller: _interestsController,
                hint: "music, comedy, workshops",
                backgroundColor: inputColor,
                textColor: textColor,
              ),
              const SizedBox(height: 20),

              Row(
                children: [
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel("profile.language".tr()),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: inputColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedLanguage,
                              isExpanded: true,
                              dropdownColor: cardColor,
                              items: [
                                DropdownMenuItem(
                                  value: 'en',
                                  child: Text('profile.english'.tr()),
                                ),
                                DropdownMenuItem(
                                  value: 'am',
                                  child: Text('profile.amharic'.tr()),
                                ),
                              ],
                              onChanged: (val) =>
                                  setState(() => _selectedLanguage = val!),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        _buildLabel("profile.gender".tr()),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16),
                          decoration: BoxDecoration(
                            color: inputColor,
                            borderRadius: BorderRadius.circular(12),
                          ),
                          child: DropdownButtonHideUnderline(
                            child: DropdownButton<String>(
                              value: _selectedGender,
                              hint: Text(
                                "profile.gender_select".tr(),
                                style: TextStyle(
                                  color: textColor.withOpacity(0.5),
                                ),
                              ),
                              isExpanded: true,
                              dropdownColor: cardColor,
                              items:
                                  {
                                    'Male': 'profile.male'.tr(),
                                    'Female': 'profile.female'.tr(),
                                    'Other': 'profile.other'.tr(),
                                  }.entries.map((entry) {
                                    return DropdownMenuItem<String>(
                                      value: entry.key,
                                      child: Text(
                                        entry.value,
                                        style: TextStyle(color: textColor),
                                      ),
                                    );
                                  }).toList(),
                              onChanged: (val) =>
                                  setState(() => _selectedGender = val),
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 20),

              _buildLabel("profile.birth_date".tr()),
              GestureDetector(
                onTap: () async {
                  final date = await showDatePicker(
                    context: context,
                    initialDate: _selectedBirthDate ?? DateTime.now(),
                    firstDate: DateTime(1900),
                    lastDate: DateTime.now(),
                  );
                  if (date != null) setState(() => _selectedBirthDate = date);
                },
                child: Container(
                  height: 48,
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  decoration: BoxDecoration(
                    color: inputColor,
                    borderRadius: BorderRadius.circular(12),
                  ),
                  alignment: Alignment.centerLeft,
                  child: Text(
                    _selectedBirthDate == null
                        ? "profile.select_date".tr()
                        : DateFormat('yyyy-MM-dd').format(_selectedBirthDate!),
                    style: TextStyle(
                      color: _selectedBirthDate == null
                          ? textColor.withOpacity(0.5)
                          : textColor,
                    ),
                  ),
                ),
              ),

              const SizedBox(height: 40),

              SizedBox(
                width: double.infinity,
                child: ElevatedButton(
                  onPressed: _isLoading ? null : _saveProfile,
                  style: ElevatedButton.styleFrom(
                    backgroundColor: const Color(0xFFFF0000),
                    foregroundColor: Colors.white,
                    padding: const EdgeInsets.symmetric(vertical: 16),
                    shape: RoundedRectangleBorder(
                      borderRadius: BorderRadius.circular(16),
                    ),
                    elevation: 0,
                  ),
                  child: _isLoading
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            color: Colors.white,
                            strokeWidth: 2,
                          ),
                        )
                      : Text(
                          "profile.save_changes".tr(),
                          style: GoogleFonts.poppins(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }

  Widget _buildLabel(String label) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, left: 4),
      child: Text(
        label,
        style: GoogleFonts.poppins(
          fontSize: 14,
          fontWeight: FontWeight.w600,
          color: const Color(0xFFFF0000),
        ),
      ),
    );
  }

  Widget _buildTextField({
    required TextEditingController controller,
    required String hint,
    required Color backgroundColor,
    required Color textColor,
    int maxLines = 1,
    TextInputType? keyboardType,
  }) {
    return TextFormField(
      controller: controller,
      maxLines: maxLines,
      keyboardType: keyboardType,
      style: TextStyle(color: textColor),
      decoration: InputDecoration(
        hintText: hint,
        hintStyle: TextStyle(color: textColor.withOpacity(0.5)),
        filled: true,
        fillColor: backgroundColor,
        border: OutlineInputBorder(
          borderRadius: BorderRadius.circular(12),
          borderSide: BorderSide.none,
        ),
        contentPadding: const EdgeInsets.symmetric(
          horizontal: 16,
          vertical: 12,
        ),
      ),
    );
  }
}
