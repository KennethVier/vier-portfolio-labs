package com.yomira.document.dto;

import java.time.LocalDateTime;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentResponse {
	
	private Long id;
	private String filename;
	private String contentType;
	private long fileSize;
	private String status;
	private LocalDateTime uploadedAt;

}
