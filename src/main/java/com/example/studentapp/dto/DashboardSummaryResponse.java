package com.example.studentapp.dto;

import java.util.List;

public record DashboardSummaryResponse(
        long totalStudents,
        long totalCourses,
        long averageAge,
        StudentResponse latestStudent,
        List<CourseBreakdown> courseBreakdown) {

    public record CourseBreakdown(String course, long totalStudents) {
    }
}
