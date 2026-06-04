package com.yomira.document.service;

import java.io.IOException;

import org.springframework.web.multipart.MultipartFile;

import com.yomira.document.dto.DocumentResponse;
import com.yomira.document.dto.DocumentTextResponse;

public interface DocumentService {
	
	DocumentResponse upload(MultipartFile file) throws IOException;
	
	DocumentResponse getDocument(Long id);
	
	DocumentTextResponse getExtractedText(Long id);

}
