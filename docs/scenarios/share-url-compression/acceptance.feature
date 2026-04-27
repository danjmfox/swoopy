Feature: Share URL Compression
  As a facilitator building a large causal loop diagram
  I want the Share button to produce a compressed URL
  So that complex models fit in chat messages without wrapping

  Background:
    Given a graph with 10 nodes and 12 edges

  # Walking skeleton — end-to-end path through the driving ports
  # @walking_skeleton @real-io
  Scenario: Compressed round-trip — encode then decode returns same graph
    When the graph is encoded for a URL via encodeGraphForUrl
    And the result is decoded via decodeGraphFromUrl
    Then the decoded graph equals the original graph

  # @real-io
  Scenario: Compressed URL is shorter than plain base64 for a complex model
    When the graph is encoded for a URL via encodeGraphForUrl
    Then the encoded string is at least 30% shorter than the equivalent plain base64

  # @real-io
  Scenario: Legacy uncompressed URL is decoded correctly
    Given a URL parameter encoded with plain base64 (pre-compression format)
    When the parameter is decoded via decodeGraphFromUrl
    Then the decoded graph equals the original graph

  # @real-io
  Scenario: Corrupt encoded parameter returns null
    Given a corrupt base64 string that is not a valid graph
    When the string is decoded via decodeGraphFromUrl
    Then the result is null

  # @real-io
  Scenario: Empty string returns null
    When an empty string is decoded via decodeGraphFromUrl
    Then the result is null

  # Store-level integration — via shareGraph() / loadFromUrl() driving ports
  # @real-io
  Scenario: shareGraph produces a compressed URL that loadFromUrl restores
    When the user shares the model via shareGraph
    Then the clipboard URL contains a ?g= parameter
    And loading the URL via loadFromUrl restores the exact same graph

  # @real-io
  Scenario: loadFromUrl with a legacy plain-base64 URL restores the graph
    Given a URL with a plain-base64 ?g= parameter (pre-compression)
    When the URL is loaded via loadFromUrl
    Then the graph is restored correctly
    And no error is shown

  # @real-io
  Scenario: loadFromUrl with a corrupt ?g= leaves current graph intact
    Given the store has a graph with 2 nodes
    And the URL has a corrupt ?g= parameter
    When the URL is loaded via loadFromUrl
    Then the store still has 2 nodes
    And no crash occurs

  # @real-io
  Scenario: shareGraph includes title when model has a title
    Given the model title is "Demo Model"
    When the user shares the model via shareGraph
    Then the clipboard URL contains title=Demo%20Model

  # @real-io
  Scenario: shareGraph omits title when model has no title
    Given the model has no title
    When the user shares the model via shareGraph
    Then the clipboard URL does not contain a title parameter
