package com.example.studentapp.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import com.example.studentapp.model.Student;

public interface StudentRepository extends JpaRepository<Student, Long> {

    List<Student> findByFullNameContainingIgnoreCaseOrCourseContainingIgnoreCaseOrEmailContainingIgnoreCaseOrEnrollmentNumberContainingIgnoreCase(
            String fullName,
            String course,
            String email,
            String enrollmentNumber);

    Optional<Student> findByEmailIgnoreCase(String email);

    Optional<Student> findByEnrollmentNumberIgnoreCase(String enrollmentNumber);
}
