use regex::Regex;
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
    let re = Regex::new(r"(?s)^---\s*\n(.*?)\n---").unwrap();

    if let Some(caps) = re.captures(content) {
        let yaml = &caps[1];
        let name = extract_yaml_field(yaml, "name").unwrap_or_default();
        let description = extract_yaml_field(yaml, "description").unwrap_or_default();
        Ok((name, description))
    } else {
        // No frontmatter, try to extract from first heading
        let heading_re = Regex::new(r"(?m)^#\s+(.+)").unwrap();
        if let Some(caps) = heading_re.captures(content) {
            Ok((caps[1].trim().to_string(), String::new()))
        } else {
            Ok((String::new(), String::new()))
        }
    }
}

fn extract_yaml_field(yaml: &str, field: &str) -> Option<String> {
    // Simple YAML parser for single-line string fields
    // Handles: name: value or name: "value" or name: 'value'
    let escaped = regex::escape(field);
    let pattern = format!("(?m)^{}:\\s*[\"']?([^\"'\\n]+)[\"']?$", escaped);
    let re = Regex::new(&pattern).ok()?;
    let caps = re.captures(yaml)?;
    Some(caps[1].trim().to_string())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn test_parse_frontmatter() {
        let content = "---\nname: find-skills\ndescription: Help users discover and install agent skills\n---\n\n# Find Skills\n\nThis is the content.\n";
        let (name, desc) = parse_frontmatter(content).unwrap();
        assert_eq!(name, "find-skills");
        assert_eq!(desc, "Help users discover and install agent skills");
    }

    #[test]
    fn test_parse_frontmatter_quoted() {
        let content = "---\nname: \"my-skill\"\ndescription: 'A test skill'\n---\n\nContent here.\n";
        let (name, desc) = parse_frontmatter(content).unwrap();
        assert_eq!(name, "my-skill");
        assert_eq!(desc, "A test skill");
    }
}
