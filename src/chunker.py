# class TextChunker:
#     def __init__(self, size=2000, overlap=200):
#         self.size = size
#         self.overlap = overlap
#
#     def chunk(self, text: str):
#         if len(text) <= self.size:
#             return [text]
#
#         chunks = []
#         start = 0
#
#         while start < len(text):
#             end = start + self.size
#             chunk = text[start:end]
#             chunks.append(chunk.strip())
#             start = end - self.overlap
#
#         return chunks

import os
from typing import Optional, List
import requests

class TextChunker:
    def __init__(self, size=1500, overlap=200):  # Reduced from 2000 to 1500
        self.size = size
        self.overlap = overlap

    def chunk(self, text: str):
        if len(text) <= self.size:
            return [text]

        chunks = []
        start = 0

        while start < len(text):
            end = start + self.size
            chunk = text[start:end]
            chunks.append(chunk.strip())
            start = end - self.overlap

        return chunks
