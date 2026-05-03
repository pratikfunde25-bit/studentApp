package com.example.studentapp.controller;

import java.util.List;

import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

import com.example.studentapp.dto.DashboardSummaryResponse;
import com.example.studentapp.dto.StudentRequest;
import com.example.studentapp.dto.StudentResponse;
import com.example.studentapp.service.StudentService;

import jakarta.validation.Valid;

@RestController
@RequestMapping({"/api/students", "/students"})
@Validated
public class StudentController {

    private final StudentService service;

    public StudentController(StudentService service) {
        this.service = service;
    }

    @GetMapping
    public List<StudentResponse> getStudents() {
        return service.getAllStudents();
    }

    @GetMapping("/{id}")
    public StudentResponse getStudent(@PathVariable Long id) {
        return service.getStudentById(id);
    }

    @GetMapping("/search")
    public List<StudentResponse> searchStudents(@RequestParam(defaultValue = "") String q) {
        return service.searchStudents(q);
    }

    @GetMapping("/dashboard-summary")
    public DashboardSummaryResponse getDashboardSummary() {
        return service.getDashboardSummary();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public StudentResponse addStudent(@Valid @RequestBody StudentRequest student) {
        return service.addStudent(student);
    }

    @PutMapping("/{id}")
    public StudentResponse updateStudent(@PathVariable Long id, @Valid @RequestBody StudentRequest student) {
        return service.updateStudent(id, student);
    }

    @ResponseStatus(HttpStatus.NO_CONTENT)
    @DeleteMapping("/{id}")
    public void deleteStudent(@PathVariable Long id) {
        service.deleteStudent(id);
    }
}
