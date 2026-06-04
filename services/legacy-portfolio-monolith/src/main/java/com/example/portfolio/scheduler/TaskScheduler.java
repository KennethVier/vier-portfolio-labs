// package com.example.portfolio.scheduler;

// import java.time.LocalDateTime;
// import java.time.temporal.ChronoUnit;
// import java.util.List;

// import org.springframework.beans.factory.annotation.Autowired;
// import org.springframework.scheduling.annotation.Scheduled;
// import org.springframework.stereotype.Component;

// import com.example.portfolio.model.Task;
// import com.example.portfolio.repository.TaskRepository;
// import com.example.portfolio.service.impl.EmailServiceImpl;

// @Component
// public class TaskScheduler {

//     @Autowired
//     TaskRepository taskRepository;

//     @Autowired
//     EmailServiceImpl emailServiceImpl;

//     @Scheduled(fixedRate = 3600000)
//     public void checkTaskDeadlines() { 
//         List<Task> tasks = taskRepository.findAll(); 
//         LocalDateTime now = LocalDateTime.now(); 
        
//         for (Task task : tasks) { 
//             LocalDateTime endDate = task.getEndDate(); 
//             if (ChronoUnit.DAYS.between(now, endDate) == 1) { 
//                 emailServiceImpl.sendEmail(task.getUser().getEmail(), "Task Deadline Reminder", "Reminder: The task \"" 
//                 + task.getTitle() + "\" is due in 1 day."); 
//             } 
//             if (ChronoUnit.HOURS.between(now, endDate) == 1) { 
//                 emailServiceImpl.sendEmail(task.getUser().getEmail(), "Task Deadline Reminder", "Reminder: The task \"" 
//                 + task.getTitle() + "\" is due in 1 hour."); 
//             } 
//             if (now.isEqual(endDate)) { 
//                 task.setStatus("Not Completed"); 
//                 taskRepository.save(task); 
//                 emailServiceImpl.sendEmail(task.getUser().getEmail(), "Task Deadline Passed", "The task \"" 
//                 + task.getTitle() + "\" was not completed within the time frame."); 
//             } 
//         } 
//     }
// }
