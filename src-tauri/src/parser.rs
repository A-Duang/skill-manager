use std::fs;

/// Parse SKILL.md frontmatter and content
/// Returns (name, description) from frontmatter
pub fn parse_skill_md(path: &std::path::Path) -> Result<(String, String), String> {
    let content = fs::read_to_string(path).map_err(|e| format!("Failed to read {}: {}", path.display(), e))?;
    parse_frontmatter(&content)
}

/// Parse YAML frontmatter from SKILL.md content
/// Returns (name, description)
pub fn parse_frontmatter(content: &str) -> Result<(String, String), String> {
    // Match --- ... --- block at start of file
    let mut in_front = false;
    let mut front_lines: Vec<&str> = Vec::new();

    for line in content.lines() {
        if !in_front {
            if line.trim() == "---" {
                in_front = true;
            }
        } else {
            if line.trim() == "---" {
                break;
            }
            front_lines.push(line);
        }
    }

    if in_front {
        let yaml = front_lines.join("\n");
        let name = extract_yaml_field(&yaml, "name").unwrap_or_default();
        let description = extract_yaml_field(&yaml, "description").unwrap_or_default();
        Ok((name, description))
    } else {
        // No frontmatter — try to extract from first heading
        for line in content.lines() {
            let trimmed = line.trim();
            if let Some(rest) = trimmed.strip_prefix("# ") {
                return Ok((rest.trim().to_string(), String::new()));
            }
        }
        Ok((String::new(), String::new()))
    }
}

/// Extract a named scalar field from YAML text.
/// Handles:
///   field: plain value (may contain quotes)
///   field: "double quoted with \"escapes\""
///   field: 'single quoted'
///   field: |         (block literal — lines joined with \n)
///   field: >         (block folded — lines joined with space)
fn extract_yaml_field(yaml: &str, field: &str) -> Option<String> {
    let lines: Vec<&str> = yaml.lines().collect();
    let prefix = format!("{}:", field);

    for (i, line) in lines.iter().enumerate() {
        if !line.starts_with(&prefix) {
            continue;
        }
        // Ensure it's exactly this field (not a field with a longer name)
        let after = &line[prefix.len()..];
        if !after.is_empty() && !after.starts_with(' ') && !after.starts_with('\t') {
            continue;
        }
        let rest = after.trim();

        // Block scalar: | (literal) or > (folded)
        let block_indent_re = rest == "|" || rest == ">" || rest.starts_with("| ") || rest.starts_with("> ");
        if rest == "|" || rest == ">" || block_indent_re {
            let is_folded = rest.starts_with('>');
            let mut block_lines: Vec<String> = Vec::new();
            let mut indent: Option<usize> = None;

            for bline in lines.iter().skip(i + 1) {
                if bline.trim().is_empty() {
                    block_lines.push(String::new());
                    continue;
                }
                let leading = bline.len() - bline.trim_start().len();
                let ind = *indent.get_or_insert(leading);
                if leading < ind {
                    break;
                }
                block_lines.push(bline[ind.min(bline.len())..].to_string());
            }

            // Strip trailing blank lines
            while block_lines.last().map(|s: &String| s.is_empty()).unwrap_or(false) {
                block_lines.pop();
            }

            let result = if is_folded {
                // Folded: join with space but preserve paragraph breaks
                let mut out = String::new();
                for bl in &block_lines {
                    if bl.is_empty() {
                        out.push('\n');
                    } else {
                        if !out.is_empty() && !out.ends_with('\n') {
                            out.push(' ');
                        }
                        out.push_str(bl);
                    }
                }
                out
            } else {
                block_lines.join("\n")
            };

            let trimmed = result.trim().to_string();
            return if trimmed.is_empty() { None } else { Some(trimmed) };
        }

        // Double-quoted string (handles \" and other backslash escapes)
        if rest.starts_with('"') {
            let mut result = String::new();
            let mut chars = rest[1..].chars();
            loop {
                match chars.next() {
                    None => break,
                    Some('\\') => match chars.next() {
                        Some('"') => result.push('"'),
                        Some('n') => result.push('\n'),
                        Some('t') => result.push('\t'),
                        Some('\\') => result.push('\\'),
                        Some(c) => { result.push('\\'); result.push(c); }
                        None => break,
                    },
                    Some('"') => break,
                    Some(c) => result.push(c),
                }
            }
            let trimmed = result.trim().to_string();
            return if trimmed.is_empty() { None } else { Some(trimmed) };
        }

        // Single-quoted string ('' is an escaped single quote)
        if rest.starts_with('\'') {
            let mut result = String::new();
            let mut chars = rest[1..].chars().peekable();
            loop {
                match chars.next() {
                    None => break,
                    Some('\'') => {
                        if chars.peek() == Some(&'\'') {
                            chars.next();
                            result.push('\'');
                        } else {
                            break;
                        }
                    }
                    Some(c) => result.push(c),
                }
            }
            let trimmed = result.trim().to_string();
            return if trimmed.is_empty() { None } else { Some(trimmed) };
        }

        // Plain unquoted value — take everything to end of line
        if !rest.is_empty() {
            return Some(rest.to_string());
        }
    }

    None
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_plain() {
        let yaml = "name: find-skills\ndescription: Help users discover and install agent skills\n";
        assert_eq!(extract_yaml_field(yaml, "description").unwrap(), "Help users discover and install agent skills");
    }

    #[test]
    fn test_plain_with_inner_quotes() {
        let yaml = r#"description: Helps users when they ask "how do I do X" or "find a skill for X""#;
        assert_eq!(
            extract_yaml_field(yaml, "description").unwrap(),
            r#"Helps users when they ask "how do I do X" or "find a skill for X""#
        );
    }

    #[test]
    fn test_double_quoted_with_escapes() {
        let yaml = r#"description: "Use when debugging. Examples: \"Why is X failing?\", \"Trace this bug\"""#;
        assert_eq!(
            extract_yaml_field(yaml, "description").unwrap(),
            r#"Use when debugging. Examples: "Why is X failing?", "Trace this bug""#
        );
    }

    #[test]
    fn test_single_quoted() {
        let yaml = "description: 'A test skill'\n";
        assert_eq!(extract_yaml_field(yaml, "description").unwrap(), "A test skill");
    }

    #[test]
    fn test_block_literal() {
        let yaml = "description: |\n  line one\n  line two\nother: val\n";
        assert_eq!(extract_yaml_field(yaml, "description").unwrap(), "line one\nline two");
    }

    #[test]
    fn test_block_folded() {
        let yaml = "description: >\n  line one\n  line two\nother: val\n";
        assert_eq!(extract_yaml_field(yaml, "description").unwrap(), "line one line two");
    }

    #[test]
    fn test_no_partial_field_match() {
        let yaml = "description_extra: wrong\ndescription: correct\n";
        assert_eq!(extract_yaml_field(yaml, "description").unwrap(), "correct");
    }
}
