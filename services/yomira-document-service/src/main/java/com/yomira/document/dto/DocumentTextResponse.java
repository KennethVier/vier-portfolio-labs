package com.yomira.document.dto;

import java.util.UUID;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class DocumentTextResponse {
	
	private Long id;
	
	private String text;
	
	private int pageCount;
}
