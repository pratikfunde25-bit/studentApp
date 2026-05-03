package com.example.studentapp.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record StudentRequest(
        @NotBlank(message = "Full name is required")
        @Size(min = 3, max = 80, message = "Full name must be between 3 and 80 characters")
        @Pattern(regexp = "^[A-Za-z ]+$", message = "Full name must contain only letters and spaces")
        String fullName,

        @NotBlank(message = "Email address is required")
        @Email(message = "Enter a valid email address")
        @Size(max = 120, message = "Email address is too long")
        String email,

        @NotBlank(message = "Course name is required")
        @Size(min = 2, max = 80, message = "Course name must be between 2 and 80 characters")
        String course,

        @NotBlank(message = "Enrollment number is required")
        @Size(min = 4, max = 30, message = "Enrollment number must be between 4 and 30 characters")
        @Pattern(regexp = "^[A-Za-z0-9-]+$", message = "Enrollment number can contain only letters, numbers, and hyphens")
        String enrollmentNumber,

        @Min(value = 16, message = "Age must be at least 16")
        @Max(value = 100, message = "Age must be less than or equal to 100")
        Integer age,

        @NotBlank(message = "Phone number is required")
        @Pattern(regexp = "^[0-9]{10}$", message = "Phone number must contain exactly 10 digits")
        String phoneNumber) {
}
