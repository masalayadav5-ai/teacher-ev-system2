package com.college.academic.evaluationsystem.dto;

public class DayUpdateDTO {
    private String topic;
    private String description;
    private String method;
    private String completedDate;
    private String remarks;
    private boolean completed;

    public String getCompletedDate() { return completedDate; }
    public void setCompletedDate(String completedDate) { this.completedDate = completedDate; }

    public String getRemarks() { return remarks; }
    public void setRemarks(String remarks) { this.remarks = remarks; }

    public boolean isCompleted() { return completed; }
    public void setCompleted(boolean completed) { this.completed = completed; }
    
    public String getTopic() { return topic; }
    public void setTopic(String topic) { this.topic = topic; }
    
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    
    public String getMethod() { return method; }
    public void setMethod(String method) { this.method = method; }
    
}