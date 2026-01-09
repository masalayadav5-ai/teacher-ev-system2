// DayDTO.java
package com.college.academic.evaluationsystem.dto;
public class DayDTO {
    private int day_number;  // Change from 'day' to 'day_number'
    private String topic;
    private String description;
    private String method;

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
}