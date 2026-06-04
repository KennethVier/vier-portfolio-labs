package com.yomira.document.entity;

import java.time.LocalDateTime;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Lob;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Entity
@Getter
@Setter
public class Document {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long documentId;

    @Column(nullable =  false)
    @NotNull
    private String fileName;

    @Column(nullable =  false)
    @NotNull
    private String contentType;

    @Lob
    private byte[] fileData;

    private String uploadedBy;

    private long fileSize;

    private int pageCount;
    
    private LocalDateTime uploadedAt;
    
    @Column(columnDefinition = "TEXT")
    private String extractedText;
}
