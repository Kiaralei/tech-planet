{% extends '_layout.swig' %}
{% import '_macro/post-collapse.swig' as post_template with context %}
{% import '_macro/post-collapse-by-category.swig' as post_by_category with context %}
{% import '_macro/sidebar.swig' as sidebar_template with context %}

{% block title %}{{ __('title.category') }}: {{ page.category }} | {{ title }}{% endblock %}

{% block class %}category{% endblock %}

{% block content %}

  {######################}
  {### CATEGORY BLOCK ###}
  {######################}
  <div class="post-block">
    <div class="posts-collapse">
      <div class="collection-title">
        <h2 class="collection-header">
          {{- page.category }}
          <small>{{ __('title.category') }}</small>
        </h2>
      </div>

      {# 如果是 Frontend 分类，按子分类分组显示 #}
      {%- if page.category === 'Frontend' %}
        {{ post_by_category.render(page.posts) }}
      {%- else %}
        {{ post_template.render(page.posts) }}
      {%- endif %}
    </div>
  </div>
  {##########################}
  {### END CATEGORY BLOCK ###}
  {##########################}

  {% include '_partials/pagination.swig' %}

{% endblock %}

{% block sidebar %}
  {{ sidebar_template.render(false) }}
{% endblock %}
