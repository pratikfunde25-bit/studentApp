package com.example.studentapp.dto;

import java.time.LocalDateTime;

public record StudentResponse(
        Long id,
        String fullName,
        String email,
        String course,
        String enrollmentNumber,
        Integer age,
        String phoneNumber,
        LocalDateTime createdAt,
        LocalDateTime updatedAt) {
}
