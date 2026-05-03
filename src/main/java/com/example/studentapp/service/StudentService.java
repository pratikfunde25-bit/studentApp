package com.example.studentapp.service;

import java.util.Comparator;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.studentapp.dto.DashboardSummaryResponse;
import com.example.studentapp.dto.StudentRequest;
import com.example.studentapp.dto.StudentResponse;
import com.example.studentapp.exception.DuplicateResourceException;
import com.example.studentapp.exception.ResourceNotFoundException;
import com.example.studentapp.model.Student;
import com.example.studentapp.repository.StudentRepository;

@Service
@Transactional
public class StudentService {

    private final StudentRepository repository;

    public StudentService(StudentRepository repository) {
        this.repository = repository;
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> getAllStudents() {
        return repository.findAll()
                .stream()
                .sorted(Comparator.comparing(Student::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public StudentResponse getStudentById(Long id) {
        return toResponse(findStudent(id));
    }

    @Transactional(readOnly = true)
    public List<StudentResponse> searchStudents(String query) {
        if (query == null || query.isBlank()) {
            return getAllStudents();
        }

        String cleanedQuery = query.trim();
        return repository
                .findByFullNameContainingIgnoreCaseOrCourseContainingIgnoreCaseOrEmailContainingIgnoreCaseOrEnrollmentNumberContainingIgnoreCase(
                        cleanedQuery,
                        cleanedQuery,
                        cleanedQuery,
                        cleanedQuery)
                .stream()
                .sorted(Comparator.comparing(Student::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())).reversed())
                .map(this::toResponse)
                .toList();
    }

    public StudentResponse addStudent(StudentRequest request) {
        validateUniqueness(request, null);

        Student student = new Student(
                sanitize(request.fullName()),
                request.email().trim().toLowerCase(Locale.ROOT),
                sanitize(request.course()),
                request.enrollmentNumber().trim().toUpperCase(Locale.ROOT),
                request.age(),
                request.phoneNumber().trim());

        return toResponse(repository.save(student));
    }

    public StudentResponse updateStudent(Long id, StudentRequest request) {
        Student existing = findStudent(id);
        validateUniqueness(request, id);

        existing.setFullName(sanitize(request.fullName()));
        existing.setEmail(request.email().trim().toLowerCase(Locale.ROOT));
        existing.setCourse(sanitize(request.course()));
        existing.setEnrollmentNumber(request.enrollmentNumber().trim().toUpperCase(Locale.ROOT));
        existing.setAge(request.age());
        existing.setPhoneNumber(request.phoneNumber().trim());

        return toResponse(repository.save(existing));
    }

    public void deleteStudent(Long id) {
        Student existing = findStudent(id);
        repository.delete(existing);
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getDashboardSummary() {
        List<Student> students = repository.findAll();
        Map<String, Long> courseCounts = students.stream()
                .collect(Collectors.groupingBy(Student::getCourse, Collectors.counting()));

        List<DashboardSummaryResponse.CourseBreakdown> breakdown = courseCounts.entrySet()
                .stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed().thenComparing(Map.Entry.comparingByKey()))
                .map(entry -> new DashboardSummaryResponse.CourseBreakdown(entry.getKey(), entry.getValue()))
                .toList();

        long averageAge = students.isEmpty()
                ? 0
                : Math.round(students.stream().mapToInt(Student::getAge).average().orElse(0));

        StudentResponse latestStudent = students.stream()
                .max(Comparator.comparing(Student::getCreatedAt, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toResponse)
                .orElse(null);

        return new DashboardSummaryResponse(
                students.size(),
                courseCounts.size(),
                averageAge,
                latestStudent,
                breakdown);
    }

    private Student findStudent(Long id) {
        return repository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Student not found for id " + id));
    }

    private void validateUniqueness(StudentRequest request, Long currentId) {
        repository.findByEmailIgnoreCase(request.email().trim())
                .filter(student -> !student.getId().equals(currentId))
                .ifPresent(student -> {
                    throw new DuplicateResourceException("A student with this email already exists");
                });

        repository.findByEnrollmentNumberIgnoreCase(request.enrollmentNumber().trim())
                .filter(student -> !student.getId().equals(currentId))
                .ifPresent(student -> {
                    throw new DuplicateResourceException("A student with this enrollment number already exists");
                });
    }

    private StudentResponse toResponse(Student student) {
        return new StudentResponse(
                student.getId(),
                student.getFullName(),
                student.getEmail(),
                student.getCourse(),
                student.getEnrollmentNumber(),
                student.getAge(),
                student.getPhoneNumber(),
                student.getCreatedAt(),
                student.getUpdatedAt());
    }

    private String sanitize(String value) {
        if (value == null) {
            return null;
        }

        return value.trim().replaceAll("\\s{2,}", " ");
    }
}
