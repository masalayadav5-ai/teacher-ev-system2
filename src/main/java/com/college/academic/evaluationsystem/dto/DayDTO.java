// DayDTO.java
package com.college.academic.evaluationsystem.dto;

import java.time.LocalDate;

public class DayDTO {

    private int day_number;  // Change from 'day' to 'day_number'
    private String topic;
    private String description;
    private String method;
    private LocalDate completedDate;   // when actually completed
    private String remarks;            // teacher remarks
    private Boolean completed;          // true / false
    // Update getters and setters

    public int getDay_number() {
        return day_number;
    }

    public void setDay_number(int day_number) {
        this.day_number = day_number;
    }

    public String getTopic() {
        return topic;
    }

    public void setTopic(String topic) {
        this.topic = topic;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getMethod() {
        return method;
    }

    public void setMethod(String method) {
        this.method = method;
    }
    public LocalDate getCompletedDate() {
    return completedDate;
}

public void setCompletedDate(LocalDate completedDate) {
    this.completedDate = completedDate;
}

public String getRemarks() {
    return remarks;
}

public void setRemarks(String remarks) {
    this.remarks = remarks;
}

public Boolean getCompleted() {
    return completed;
}

public void setCompleted(Boolean completed) {
    this.completed = completed;
}

}