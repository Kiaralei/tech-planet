{% macro render(posts) %}
{%- set current_subcategory = '' %}
{%- for post in posts.toArray() %}

  {# 获取子分类名称 #}
  {%- set subcategory = '' %}
  {%- if post.categories.length >= 2 %}
    {%- set subcategory = post.categories.data[1].name %}
  {%- elif post.categories.length === 1 %}
    {%- set subcategory = post.categories.data[0].name %}
  {%- else %}
    {%- set subcategory = '未分类' %}
  {%- endif %}

  {# 如果子分类改变，显示新的分组标题 #}
  {%- if subcategory !== current_subcategory %}
    {%- set current_subcategory = subcategory %}
    <div class="collection-year">
      <span class="collection-header">📁 {{ current_subcategory }}</span>
    </div>
  {%- endif %}

  <article itemscope itemtype="http://schema.org/Article">
    <header class="post-header">

      <div class="post-meta">
        <time itemprop="dateCreated"
              datetime="{{ moment(post.date).format() }}"
              content="{{ date(post.date, config.date_format) }}">
          {{ date(post.date, 'MM-DD') }}
        </time>
      </div>

      <div class="post-title">
        {%- if post.link %}{# Link posts #}
          {%- set postTitleIcon = '<i class="fa fa-external-link"></i>' %}
          {%- set postText = post.title or post.link %}
          {{ next_url(post.link, postText + postTitleIcon, {class: 'post-title-link post-title-link-external', itemprop: 'url'}) }}
        {% else %}
          <a class="post-title-link" href="{{ url_for(post.path) }}" itemprop="url">
            <span itemprop="name">{{ post.title or __('post.untitled') }}</span>
          </a>
        {%- endif %}
      </div>

    </header>
  </article>

{%- endfor %}
{% endmacro %}

