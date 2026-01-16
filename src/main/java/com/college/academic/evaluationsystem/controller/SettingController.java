package com.college.academic.evaluationsystem.controller;

import com.college.academic.evaluationsystem.model.Setting;
import com.college.academic.evaluationsystem.service.SettingService;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/settings")
@CrossOrigin
public class SettingController {

    private final SettingService settingService;

    public SettingController(SettingService settingService) {
        this.settingService = settingService;
    }

    /* ---------------------------
       GET SYSTEM SETTINGS
    --------------------------- */
    @GetMapping
    public Setting getSettings() {
        return settingService.getSettings();
    }

    /* ---------------------------
       UPDATE SYSTEM SETTINGS
    --------------------------- */
    @PutMapping
    public Setting updateSettings(@RequestBody Setting setting) {
        return settingService.updateSettings(setting);
    }
}